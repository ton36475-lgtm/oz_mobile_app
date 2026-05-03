/**
 * Model Manager
 * Manages LLM models and their capabilities
 */

import type { LLMModel, LLMProvider, ModelCapability, PromptType, DebugLog } from './types';

export class ModelManager {
  private models: Map<LLMModel, ModelCapability> = new Map();
  private debugLogs: DebugLog[] = [];

  constructor() {
    this.initializeModels();
    this.log('info', 'ModelManager initialized');
  }

  /**
   * Get model capability
   */
  getModelCapability(model: LLMModel): ModelCapability | undefined {
    return this.models.get(model);
  }

  /**
   * Get all models
   */
  getAllModels(): ModelCapability[] {
    return Array.from(this.models.values());
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(provider: LLMProvider): ModelCapability[] {
    return Array.from(this.models.values()).filter((m) => m.provider === provider);
  }

  /**
   * Get models by prompt type
   */
  getModelsByPromptType(promptType: PromptType): ModelCapability[] {
    return Array.from(this.models.values()).filter((m) => m.supportedPromptTypes.includes(promptType));
  }

  /**
   * Get best model for prompt type
   */
  getBestModelForPromptType(promptType: PromptType): ModelCapability | undefined {
    const candidates = this.getModelsByPromptType(promptType);
    if (candidates.length === 0) return undefined;

    // Sort by reliability and latency
    return candidates.sort((a, b) => {
      const scoreA = (a.reliability || 0.5) - (a.latencyMs || 1000) / 10000;
      const scoreB = (b.reliability || 0.5) - (b.latencyMs || 1000) / 10000;
      return scoreB - scoreA;
    })[0];
  }

  /**
   * Get models with function calling support
   */
  getModelsWithFunctionCalling(): ModelCapability[] {
    return Array.from(this.models.values()).filter((m) => m.supportsFunctionCalling);
  }

  /**
   * Get models with streaming support
   */
  getModelsWithStreaming(): ModelCapability[] {
    return Array.from(this.models.values()).filter((m) => m.supportsStreaming);
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

  private initializeModels(): void {
    // OpenAI Models
    this.models.set('gpt-4', {
      model: 'gpt-4',
      provider: 'openai',
      maxTokens: 8192,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportedPromptTypes: ['general', 'coding', 'analysis', 'creative', 'debate', 'tool-use'],
      costPerMTok: 0.03,
      latencyMs: 800,
      reliability: 0.98,
    });

    this.models.set('gpt-3.5-turbo', {
      model: 'gpt-3.5-turbo',
      provider: 'openai',
      maxTokens: 4096,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportedPromptTypes: ['general', 'coding', 'analysis', 'creative'],
      costPerMTok: 0.0015,
      latencyMs: 500,
      reliability: 0.96,
    });

    // DeepSeek Models
    this.models.set('deepseek-v3', {
      model: 'deepseek-v3',
      provider: 'deepseek',
      maxTokens: 8192,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportedPromptTypes: ['general', 'coding', 'analysis', 'debate', 'tool-use'],
      costPerMTok: 0.001,
      latencyMs: 1200,
      reliability: 0.94,
    });

    this.models.set('deepseek-coder', {
      model: 'deepseek-coder',
      provider: 'deepseek',
      maxTokens: 4096,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportedPromptTypes: ['coding', 'tool-use'],
      costPerMTok: 0.0008,
      latencyMs: 900,
      reliability: 0.95,
    });

    // Codex Model
    this.models.set('codex', {
      model: 'codex',
      provider: 'openai',
      maxTokens: 4096,
      supportsFunctionCalling: false,
      supportsStreaming: true,
      supportedPromptTypes: ['coding'],
      costPerMTok: 0.002,
      latencyMs: 1000,
      reliability: 0.92,
    });

    // Anthropic Claude
    this.models.set('claude-3', {
      model: 'claude-3',
      provider: 'anthropic',
      maxTokens: 200000,
      supportsFunctionCalling: true,
      supportsStreaming: true,
      supportedPromptTypes: ['general', 'coding', 'analysis', 'creative', 'debate'],
      costPerMTok: 0.015,
      latencyMs: 1500,
      reliability: 0.97,
    });

    // Local LLM
    this.models.set('local-llm', {
      model: 'local-llm',
      provider: 'local',
      maxTokens: 2048,
      supportsFunctionCalling: false,
      supportsStreaming: true,
      supportedPromptTypes: ['general', 'coding'],
      costPerMTok: 0,
      latencyMs: 2000,
      reliability: 0.85,
    });

    this.log('info', 'Models initialized', { count: this.models.size });
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: Record<string, any>): void {
    const log: DebugLog = {
      level,
      message,
      timestamp: new Date(),
      context,
    };
    this.debugLogs.push(log);
    console.log(`[ModelManager] [${level.toUpperCase()}] ${message}`, context);
  }
}
