/**
 * Tool Executor Types
 * Tool registry, execution, and chaining
 */

export type ToolCategory = 'system' | 'file' | 'network' | 'ai' | 'database' | 'custom';
export type ParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'file';
export type ExecutionStatus = 'pending' | 'running' | 'success' | 'error' | 'timeout' | 'cancelled';

export interface ToolParameter {
  name: string;
  type: ParameterType;
  description: string;
  required: boolean;
  default?: any;
  enum?: any[];
  pattern?: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  version: string;
  parameters: ToolParameter[];
  returns: {
    type: ParameterType;
    description: string;
  };
  timeout?: number;
  retryable?: boolean;
  maxRetries?: number;
  dependencies?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolInput {
  toolId: string;
  parameters: Record<string, any>;
  timeout?: number;
  retryAttempts?: number;
}

export interface ToolOutput {
  toolId: string;
  executionId: string;
  status: ExecutionStatus;
  result?: any;
  error?: string;
  duration: number; // milliseconds
  startedAt: Date;
  completedAt: Date;
  retryCount: number;
}

export interface ToolExecution {
  id: string;
  toolId: string;
  input: ToolInput;
  output?: ToolOutput;
  status: ExecutionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolChain {
  id: string;
  name: string;
  description: string;
  steps: ToolChainStep[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ToolChainStep {
  id: string;
  toolId: string;
  order: number;
  parameters: Record<string, any>;
  condition?: string;
  onError?: 'continue' | 'stop' | 'retry';
  maxRetries?: number;
}

export interface ToolChainExecution {
  id: string;
  chainId: string;
  status: ExecutionStatus;
  steps: ToolExecution[];
  result?: any;
  error?: string;
  duration: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface DebugLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}
