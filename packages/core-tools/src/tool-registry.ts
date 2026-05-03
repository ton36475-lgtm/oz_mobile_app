/**
 * Tool Registry
 * Manages tool definitions and registration
 */

import type { ToolDefinition, ToolCategory, DebugLog } from './types';

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private debugLogs: DebugLog[] = [];

  constructor() {
    this.initializeBuiltInTools();
    this.log('info', 'ToolRegistry initialized');
  }

  /**
   * Register a new tool
   */
  registerTool(tool: ToolDefinition): void {
    if (this.tools.has(tool.id)) {
      this.log('warn', 'Tool already registered, overwriting', { toolId: tool.id });
    }

    this.tools.set(tool.id, tool);
    this.log('info', 'Tool registered', { toolId: tool.id, name: tool.name });
  }

  /**
   * Get tool by ID
   */
  getTool(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  /**
   * Get all tools
   */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: ToolCategory): ToolDefinition[] {
    return Array.from(this.tools.values()).filter((t) => t.category === category);
  }

  /**
   * Get tools by tag
   */
  getToolsByTag(tag: string): ToolDefinition[] {
    return Array.from(this.tools.values()).filter((t) => t.tags?.includes(tag));
  }

  /**
   * Search tools
   */
  searchTools(query: string): ToolDefinition[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tools.values()).filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );
  }

  /**
   * Validate tool parameters
   */
  validateToolParameters(toolId: string, parameters: Record<string, any>): { valid: boolean; errors: string[] } {
    const tool = this.getTool(toolId);
    if (!tool) {
      return { valid: false, errors: [`Tool not found: ${toolId}`] };
    }

    const errors: string[] = [];

    // Check required parameters
    for (const param of tool.parameters) {
      if (param.required && !(param.name in parameters)) {
        errors.push(`Missing required parameter: ${param.name}`);
      }

      if (param.name in parameters) {
        const value = parameters[param.name];

        // Type validation
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== param.type && actualType !== 'object') {
          errors.push(`Parameter ${param.name} has wrong type. Expected ${param.type}, got ${actualType}`);
        }

        // Enum validation
        if (param.enum && !param.enum.includes(value)) {
          errors.push(`Parameter ${param.name} has invalid value. Must be one of: ${param.enum.join(', ')}`);
        }

        // Pattern validation
        if (param.pattern && typeof value === 'string') {
          const regex = new RegExp(param.pattern);
          if (!regex.test(value)) {
            errors.push(`Parameter ${param.name} does not match pattern: ${param.pattern}`);
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get tool count
   */
  getToolCount(): number {
    return this.tools.size;
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

  private initializeBuiltInTools(): void {
    // System Tools
    this.registerTool({
      id: 'system-info',
      name: 'System Information',
      description: 'Get system information (OS, CPU, Memory)',
      category: 'system',
      version: '1.0.0',
      parameters: [],
      returns: { type: 'object', description: 'System information' },
      timeout: 5000,
      tags: ['system', 'info'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.registerTool({
      id: 'system-exec',
      name: 'Execute Command',
      description: 'Execute system command',
      category: 'system',
      version: '1.0.0',
      parameters: [
        { name: 'command', type: 'string', description: 'Command to execute', required: true },
        { name: 'timeout', type: 'number', description: 'Execution timeout in ms', required: false, default: 30000 },
      ],
      returns: { type: 'object', description: 'Command output' },
      timeout: 30000,
      retryable: true,
      maxRetries: 2,
      tags: ['system', 'exec'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // File Tools
    this.registerTool({
      id: 'file-read',
      name: 'Read File',
      description: 'Read file content',
      category: 'file',
      version: '1.0.0',
      parameters: [
        { name: 'path', type: 'string', description: 'File path', required: true },
        { name: 'encoding', type: 'string', description: 'File encoding', required: false, default: 'utf-8' },
      ],
      returns: { type: 'string', description: 'File content' },
      timeout: 5000,
      tags: ['file', 'read'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.registerTool({
      id: 'file-write',
      name: 'Write File',
      description: 'Write content to file',
      category: 'file',
      version: '1.0.0',
      parameters: [
        { name: 'path', type: 'string', description: 'File path', required: true },
        { name: 'content', type: 'string', description: 'Content to write', required: true },
        { name: 'append', type: 'boolean', description: 'Append to file', required: false, default: false },
      ],
      returns: { type: 'object', description: 'Write result' },
      timeout: 5000,
      tags: ['file', 'write'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Network Tools
    this.registerTool({
      id: 'http-request',
      name: 'HTTP Request',
      description: 'Make HTTP request',
      category: 'network',
      version: '1.0.0',
      parameters: [
        { name: 'url', type: 'string', description: 'URL to request', required: true },
        { name: 'method', type: 'string', description: 'HTTP method', required: false, default: 'GET', enum: ['GET', 'POST', 'PUT', 'DELETE'] },
        { name: 'headers', type: 'object', description: 'Request headers', required: false },
        { name: 'body', type: 'string', description: 'Request body', required: false },
      ],
      returns: { type: 'object', description: 'HTTP response' },
      timeout: 30000,
      retryable: true,
      maxRetries: 3,
      tags: ['network', 'http'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // AI Tools
    this.registerTool({
      id: 'ai-prompt',
      name: 'AI Prompt',
      description: 'Send prompt to AI',
      category: 'ai',
      version: '1.0.0',
      parameters: [
        { name: 'prompt', type: 'string', description: 'Prompt text', required: true },
        { name: 'model', type: 'string', description: 'AI model', required: false, default: 'gpt-4' },
        { name: 'maxTokens', type: 'number', description: 'Max tokens', required: false, default: 2000 },
      ],
      returns: { type: 'string', description: 'AI response' },
      timeout: 60000,
      retryable: true,
      maxRetries: 2,
      tags: ['ai', 'prompt'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    this.log('info', 'Built-in tools initialized', { count: this.tools.size });
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: Record<string, any>): void {
    const log: DebugLog = {
      level,
      message,
      timestamp: new Date(),
      context,
    };
    this.debugLogs.push(log);
    console.log(`[ToolRegistry] [${level.toUpperCase()}] ${message}`, context);
  }
}
