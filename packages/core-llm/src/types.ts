/**
 * LLM Router Types
 * Model selection, routing, and integration
 */

export type LLMProvider = 'openai' | 'deepseek' | 'codex' | 'anthropic' | 'local';
export type LLMModel = 'gpt-4' | 'gpt-3.5-turbo' | 'deepseek-v3' | 'deepseek-coder' | 'codex' | 'claude-3' | 'local-llm';
export type PromptType = 'general' | 'coding' | 'analysis' | 'creative' | 'debate' | 'tool-use' | 'context-retrieval';
export type ResponseFormat = 'text' | 'json' | 'structured' | 'streaming';

export interface LLMConfig {
  provider: LLMProvider;
  model: LLMModel;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  timeout?: number;
}

export interface LLMRequest {
  id: string;
  prompt: string;
  promptType: PromptType;
  model?: LLMModel;
  provider?: LLMProvider;
  systemPrompt?: string;
  context?: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: ResponseFormat;
  tools?: ToolDefinition[];
  createdAt: Date;
}

export interface LLMResponse {
  id: string;
  requestId: string;
  provider: LLMProvider;
  model: LLMModel;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'tool_use' | 'error';
  toolCalls?: ToolCall[];
  error?: string;
  createdAt: Date;
  duration: number; // milliseconds
}

export interface ModelCapability {
  model: LLMModel;
  provider: LLMProvider;
  maxTokens: number;
  supportsFunctionCalling: boolean;
  supportsStreaming: boolean;
  supportedPromptTypes: PromptType[];
  costPerMTok?: number;
  latencyMs?: number;
  reliability: number; // 0-1
}

export interface RoutingStrategy {
  promptType: PromptType;
  preferredModels: LLMModel[];
  fallbackModels: LLMModel[];
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>;
  required?: string[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface DebugLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}
