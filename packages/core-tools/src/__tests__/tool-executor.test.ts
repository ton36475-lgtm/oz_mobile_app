/**
 * Tool Executor Unit Tests
 * Hard test debugging with comprehensive coverage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ToolExecutor } from '../tool-executor';
import type { ToolInput, ToolChain, ToolChainStep } from '../types';

describe('ToolExecutor', () => {
  let executor: ToolExecutor;

  beforeEach(() => {
    executor = new ToolExecutor();
  });

  afterEach(() => {
    executor.clearLogs();
  });

  describe('Tool Registry', () => {
    it('should have built-in tools registered', () => {
      const registry = executor.getRegistry();
      expect(registry.getToolCount()).toBeGreaterThan(0);
    });

    it('should get tool by ID', () => {
      const registry = executor.getRegistry();
      const tool = registry.getTool('system-info');

      expect(tool).toBeDefined();
      expect(tool?.name).toBe('System Information');
    });

    it('should get tools by category', () => {
      const registry = executor.getRegistry();
      const systemTools = registry.getToolsByCategory('system');

      expect(systemTools.length).toBeGreaterThan(0);
      expect(systemTools.every((t) => t.category === 'system')).toBe(true);
    });

    it('should search tools', () => {
      const registry = executor.getRegistry();
      const results = registry.searchTools('system');

      expect(results.length).toBeGreaterThan(0);
    });

    it('should validate tool parameters', () => {
      const registry = executor.getRegistry();

      // Valid parameters
      const validResult = registry.validateToolParameters('system-exec', { command: 'ls -la' });
      expect(validResult.valid).toBe(true);

      // Missing required parameter
      const invalidResult = registry.validateToolParameters('system-exec', {});
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Tool Execution', () => {
    it('should execute system-info tool', async () => {
      const input: ToolInput = {
        toolId: 'system-info',
        parameters: {},
      };

      const output = await executor.executeTool(input);

      expect(output).toBeDefined();
      expect(output.status).toBe('success');
      expect(output.result).toBeDefined();
      expect(output.result.os).toBeDefined();
    });

    it('should execute system-exec tool', async () => {
      const input: ToolInput = {
        toolId: 'system-exec',
        parameters: { command: 'echo "test"' },
      };

      const output = await executor.executeTool(input);

      expect(output).toBeDefined();
      expect(output.status).toBe('success');
      expect(output.result.stdout).toBeDefined();
    });

    it('should execute file-read tool', async () => {
      const input: ToolInput = {
        toolId: 'file-read',
        parameters: { path: '/tmp/test.txt' },
      };

      const output = await executor.executeTool(input);

      expect(output).toBeDefined();
      expect(output.status).toBe('success');
      expect(output.result.content).toBeDefined();
    });

    it('should execute file-write tool', async () => {
      const input: ToolInput = {
        toolId: 'file-write',
        parameters: { path: '/tmp/test.txt', content: 'test content' },
      };

      const output = await executor.executeTool(input);

      expect(output).toBeDefined();
      expect(output.status).toBe('success');
      expect(output.result.success).toBe(true);
    });

    it('should execute http-request tool', async () => {
      const input: ToolInput = {
        toolId: 'http-request',
        parameters: { url: 'https://api.example.com/data' },
      };

      const output = await executor.executeTool(input);

      expect(output).toBeDefined();
      expect(output.status).toBe('success');
      expect(output.result.status).toBe(200);
    });

    it('should execute ai-prompt tool', async () => {
      const input: ToolInput = {
        toolId: 'ai-prompt',
        parameters: { prompt: 'What is AI?' },
      };

      const output = await executor.executeTool(input);

      expect(output).toBeDefined();
      expect(output.status).toBe('success');
      expect(output.result.response).toBeDefined();
    });

    it('should throw error for non-existent tool', async () => {
      const input: ToolInput = {
        toolId: 'non-existent-tool',
        parameters: {},
      };

      try {
        await executor.executeTool(input);
        expect.fail('Should throw error');
      } catch (error) {
        expect(String(error)).toContain('Tool not found');
      }
    });

    it('should throw error for invalid parameters', async () => {
      const input: ToolInput = {
        toolId: 'system-exec',
        parameters: {}, // Missing required 'command' parameter
      };

      try {
        await executor.executeTool(input);
        expect.fail('Should throw error');
      } catch (error) {
        expect(String(error)).toContain('Parameter validation failed');
      }
    });
  });

  describe('Tool Execution Tracking', () => {
    it('should track tool executions', async () => {
      const input: ToolInput = {
        toolId: 'system-info',
        parameters: {},
      };

      await executor.executeTool(input);

      const executions = executor.getAllExecutions();
      expect(executions.length).toBeGreaterThan(0);
    });

    it('should get execution by ID', async () => {
      const input: ToolInput = {
        toolId: 'system-info',
        parameters: {},
      };

      const output = await executor.executeTool(input);
      const execution = executor.getExecution(output.executionId);

      expect(execution).toBeDefined();
      expect(execution?.status).toBe('success');
    });

    it('should track execution duration', async () => {
      const input: ToolInput = {
        toolId: 'system-info',
        parameters: {},
      };

      const output = await executor.executeTool(input);

      expect(output.duration).toBeGreaterThanOrEqual(0);
      expect(output.startedAt).toBeDefined();
      expect(output.completedAt).toBeDefined();
    });
  });

  describe('Tool Chain Execution', () => {
    it('should execute tool chain', async () => {
      const chain: ToolChain = {
        id: 'test-chain',
        name: 'Test Chain',
        description: 'Test tool chain',
        steps: [
          {
            id: 'step-1',
            toolId: 'system-info',
            order: 1,
            parameters: {},
          },
          {
            id: 'step-2',
            toolId: 'system-exec',
            order: 2,
            parameters: { command: 'echo "step 2"' },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const execution = await executor.executeToolChain(chain);

      expect(execution).toBeDefined();
      expect(execution.status).toBe('success');
      expect(execution.steps.length).toBe(2);
    });

    it('should handle chain step errors with continue', async () => {
      const chain: ToolChain = {
        id: 'test-chain-continue',
        name: 'Test Chain Continue',
        description: 'Test tool chain with error continue',
        steps: [
          {
            id: 'step-1',
            toolId: 'system-info',
            order: 1,
            parameters: {},
            onError: 'continue',
          },
          {
            id: 'step-2',
            toolId: 'system-exec',
            order: 2,
            parameters: { command: 'echo "step 2"' },
            onError: 'continue',
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const execution = await executor.executeToolChain(chain);

      expect(execution).toBeDefined();
      expect(execution.steps.length).toBeGreaterThan(0);
    });

    it('should track chain executions', async () => {
      const chain: ToolChain = {
        id: 'test-chain-2',
        name: 'Test Chain 2',
        description: 'Test tool chain 2',
        steps: [
          {
            id: 'step-1',
            toolId: 'system-info',
            order: 1,
            parameters: {},
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await executor.executeToolChain(chain);

      const executions = executor.getAllChainExecutions();
      expect(executions.length).toBeGreaterThan(0);
    });

    it('should get chain execution by ID', async () => {
      const chain: ToolChain = {
        id: 'test-chain-3',
        name: 'Test Chain 3',
        description: 'Test tool chain 3',
        steps: [
          {
            id: 'step-1',
            toolId: 'system-info',
            order: 1,
            parameters: {},
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const execution = await executor.executeToolChain(chain);
      const retrieved = executor.getChainExecution(execution.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.chainId).toBe(chain.id);
    });
  });

  describe('Logging', () => {
    it('should collect debug logs', async () => {
      const input: ToolInput = {
        toolId: 'system-info',
        parameters: {},
      };

      await executor.executeTool(input);

      const logs = executor.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log.level === 'info')).toBe(true);
    });

    it('should clear debug logs', async () => {
      const input: ToolInput = {
        toolId: 'system-info',
        parameters: {},
      };

      await executor.executeTool(input);
      executor.clearLogs();

      const logs = executor.getLogs();
      expect(logs).toHaveLength(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should execute multiple tools sequentially', async () => {
      const tools = ['system-info', 'system-exec', 'file-read'];

      for (const toolId of tools) {
        const input: ToolInput = {
          toolId,
          parameters: toolId === 'system-exec' ? { command: 'echo test' } : toolId === 'file-read' ? { path: '/tmp/test.txt' } : {},
        };

        const output = await executor.executeTool(input);
        expect(output.status).toBe('success');
      }

      const executions = executor.getAllExecutions();
      expect(executions.length).toBe(tools.length);
    });

    it('should handle tool retry logic', async () => {
      const input: ToolInput = {
        toolId: 'system-info',
        parameters: {},
        retryAttempts: 2,
      };

      const output = await executor.executeTool(input);

      expect(output).toBeDefined();
      expect(output.retryCount).toBeGreaterThanOrEqual(0);
    });
  });
});
