/**
 * LLM Router Package
 * Multi-AI integration with fallback logic (Manus, Claude, Gemini, ChatGPT, DeepSeek)
 */

export { LLMRouter } from './llm-router';
export { ModelManager } from './model-manager';
export { ManusAIProvider, ClaudeAIProvider, GeminiAIProvider, DeepSeekAIProvider } from './llm-provider';
export type { ILLMProvider } from './llm-provider';
export type {
  LLMProvider,
  LLMModel,
  PromptType,
  ResponseFormat,
  LLMConfig,
  LLMRequest,
  LLMResponse,
  ModelCapability,
  RoutingStrategy,
  ToolDefinition,
  ToolCall,
  DebugLog,
} from './types';
