/**
 * Tool Executor
 * Executes tools with error handling, retries, and chaining
 */

import type { ToolInput, ToolOutput, ToolExecution, ToolChain, ToolChainExecution, ExecutionStatus, DebugLog } from './types';
import { ToolRegistry } from './tool-registry';

export class ToolExecutor {
  private registry: ToolRegistry;
  private executions: Map<string, ToolExecution> = new Map();
  private chainExecutions: Map<string, ToolChainExecution> = new Map();
  private debugLogs: DebugLog[] = [];
  private executionCounter: number = 0;

  constructor() {
    this.registry = new ToolRegistry();
    this.log('info', 'ToolExecutor initialized');
  }

  /**
   * Get tool registry
   */
  getRegistry(): ToolRegistry {
    return this.registry;
  }

  /**
   * Execute a single tool
   */
  async executeTool(input: ToolInput): Promise<ToolOutput> {
    const executionId = `exec-${this.executionCounter++}`;
    const startTime = Date.now();

    this.log('info', 'Tool execution started', { executionId, toolId: input.toolId });

    const tool = this.registry.getTool(input.toolId);
    if (!tool) {
      throw new Error(`Tool not found: ${input.toolId}`);
    }

    // Validate parameters
    const validation = this.registry.validateToolParameters(input.toolId, input.parameters);
    if (!validation.valid) {
      throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);
    }

    let lastError: Error | null = null;
    let retryCount = 0;
    const maxRetries = input.retryAttempts || tool.maxRetries || 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          this.log('debug', 'Retrying tool execution', { executionId, toolId: input.toolId, attempt });
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }

        const result = await this.executeToolInternal(tool.id, input.parameters, input.timeout || tool.timeout);

        const output: ToolOutput = {
          toolId: input.toolId,
          executionId,
          status: 'success',
          result,
          duration: Date.now() - startTime,
          startedAt: new Date(startTime),
          completedAt: new Date(),
          retryCount,
        };

        this.log('info', 'Tool execution succeeded', { executionId, toolId: input.toolId, duration: output.duration });

        // Store execution
        const execution: ToolExecution = {
          id: executionId,
          toolId: input.toolId,
          input,
          output,
          status: 'success',
          createdAt: new Date(startTime),
          updatedAt: new Date(),
        };
        this.executions.set(executionId, execution);

        return output;
      } catch (error) {
        lastError = error as Error;
        retryCount++;
        this.log('warn', 'Tool execution failed', { executionId, toolId: input.toolId, error: String(error), attempt });

        if (attempt === maxRetries) {
          // All retries exhausted
          break;
        }
      }
    }

    // All attempts failed
    const output: ToolOutput = {
      toolId: input.toolId,
      executionId,
      status: 'error',
      error: lastError?.message || 'Unknown error',
      duration: Date.now() - startTime,
      startedAt: new Date(startTime),
      completedAt: new Date(),
      retryCount,
    };

    this.log('error', 'Tool execution failed after retries', { executionId, toolId: input.toolId, error: lastError?.message });

    // Store execution
    const execution: ToolExecution = {
      id: executionId,
      toolId: input.toolId,
      input,
      output,
      status: 'error',
      createdAt: new Date(startTime),
      updatedAt: new Date(),
    };
    this.executions.set(executionId, execution);

    throw new Error(`Tool execution failed: ${lastError?.message}`);
  }

  /**
   * Execute a tool chain
   */
  async executeToolChain(chain: ToolChain): Promise<ToolChainExecution> {
    const chainExecutionId = `chain-${this.executionCounter++}`;
    const startTime = Date.now();

    this.log('info', 'Tool chain execution started', { chainId: chain.id, steps: chain.steps.length });

    const steps: ToolExecution[] = [];
    let status: ExecutionStatus = 'success';
    let error: string | undefined;

    for (const step of chain.steps) {
      try {
        this.log('debug', 'Executing chain step', { chainId: chain.id, stepId: step.id, order: step.order });

        const input: ToolInput = {
          toolId: step.toolId,
          parameters: step.parameters,
          timeout: undefined,
          retryAttempts: step.maxRetries,
        };

        const output = await this.executeTool(input);

        const execution: ToolExecution = {
          id: `step-${step.id}`,
          toolId: step.toolId,
          input,
          output,
          status: 'success',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        steps.push(execution);
      } catch (err) {
        const stepError = String(err);
        this.log('error', 'Chain step failed', { chainId: chain.id, stepId: step.id, error: stepError });

        if (step.onError === 'stop') {
          status = 'error';
          error = stepError;
          break;
        } else if (step.onError === 'continue') {
          // Continue to next step
          continue;
        } else if (step.onError === 'retry') {
          // Retry logic handled by executeTool
          status = 'error';
          error = stepError;
          break;
        }
      }
    }

    const chainExecution: ToolChainExecution = {
      id: chainExecutionId,
      chainId: chain.id,
      status,
      steps,
      error,
      duration: Date.now() - startTime,
      createdAt: new Date(startTime),
      completedAt: new Date(),
    };

    this.chainExecutions.set(chainExecutionId, chainExecution);

    this.log('info', 'Tool chain execution completed', { chainId: chain.id, status, duration: chainExecution.duration });

    return chainExecution;
  }

  /**
   * Get execution by ID
   */
  getExecution(executionId: string): ToolExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Get all executions
   */
  getAllExecutions(): ToolExecution[] {
    return Array.from(this.executions.values());
  }

  /**
   * Get chain execution by ID
   */
  getChainExecution(chainExecutionId: string): ToolChainExecution | undefined {
    return this.chainExecutions.get(chainExecutionId);
  }

  /**
   * Get all chain executions
   */
  getAllChainExecutions(): ToolChainExecution[] {
    return Array.from(this.chainExecutions.values());
  }

  /**
   * Get debug logs
   */
  getLogs(): DebugLog[] {
    return [...this.debugLogs];
  }

  /**
   * Clear debug logs
   */
  clearLogs(): void {
    this.debugLogs = [];
  }

  // Private helper methods

  private async executeToolInternal(toolId: string, parameters: Record<string, any>, timeout?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeoutHandle = timeout
        ? setTimeout(() => {
            reject(new Error(`Tool execution timeout after ${timeout}ms`));
          }, timeout)
        : null;

      try {
        // Simulate tool execution based on tool ID
        let result: any;

        if (toolId === 'system-info') {
          result = {
            os: process.platform,
            nodeVersion: process.version,
            uptime: process.uptime(),
          };
        } else if (toolId === 'system-exec') {
          // In production, would execute actual command
          result = {
            stdout: `Command executed: ${parameters.command}`,
            stderr: '',
            exitCode: 0,
          };
        } else if (toolId === 'file-read') {
          // In production, would read actual file
          result = {
            content: `[Mock content of ${parameters.path}]`,
            size: 1024,
          };
        } else if (toolId === 'file-write') {
          // In production, would write actual file
          result = {
            path: parameters.path,
            bytesWritten: parameters.content.length,
            success: true,
          };
        } else if (toolId === 'http-request') {
          // In production, would make actual HTTP request
          result = {
            status: 200,
            headers: { 'content-type': 'application/json' },
            body: { message: 'Mock response' },
          };
        } else if (toolId === 'ai-prompt') {
          // In production, would call AI
          result = {
            response: `[AI Response to: ${parameters.prompt.substring(0, 50)}...]`,
            tokens: 100,
          };
        } else {
          result = { message: 'Tool executed successfully', toolId };
        }

        if (timeoutHandle) clearTimeout(timeoutHandle);
        resolve(result);
      } catch (error) {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        reject(error);
      }
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: Record<string, any>): void {
    const log: DebugLog = {
      level,
      message,
      timestamp: new Date(),
      context,
    };
    this.debugLogs.push(log);
    console.log(`[ToolExecutor] [${level.toUpperCase()}] ${message}`, context);
  }
}
