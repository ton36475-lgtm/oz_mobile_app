/**
 * LLM Router
 * Routes requests to appropriate AI provider with fallback logic
 */

import type { LLMRequest, LLMResponse, LLMConfig, RoutingStrategy, PromptType, DebugLog } from './types';
import type { ILLMProvider } from './llm-provider';
import { ManusAIProvider, ClaudeAIProvider, GeminiAIProvider, DeepSeekAIProvider } from './llm-provider';
import { ModelManager } from './model-manager';

export class LLMRouter {
  private providers: Map<string, ILLMProvider> = new Map();
  private modelManager: ModelManager;
  private routingStrategies: Map<PromptType, RoutingStrategy> = new Map();
  private debugLogs: DebugLog[] = [];
  private requestCounter: number = 0;

  constructor() {
    this.modelManager = new ModelManager();
    this.initializeProviders();
    this.initializeRoutingStrategies();
    this.log('info', 'LLMRouter initialized');
  }

  /**
   * Register LLM provider
   */
  registerProvider(name: string, provider: ILLMProvider): void {
    this.providers.set(name, provider);
    this.log('info', 'Provider registered', { name });
  }

  /**
   * Send request to appropriate provider with fallback
   */
  async sendRequest(prompt: string, promptType: PromptType = 'general', options?: Partial<LLMRequest>): Promise<LLMResponse> {
    const requestId = `req-${this.requestCounter++}`;

    const request: LLMRequest = {
      id: requestId,
      prompt,
      promptType,
      ...options,
      createdAt: new Date(),
    };

    this.log('info', 'Request received', { requestId, promptType });

    const strategy = this.routingStrategies.get(promptType) || this.getDefaultStrategy();
    const providers = this.getProvidersForStrategy(strategy);

    if (providers.length === 0) {
      throw new Error(`No providers available for prompt type: ${promptType}`);
    }

    // Try each provider in order
    let lastError: Error | null = null;

    for (const providerName of providers) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;

      try {
        this.log('debug', 'Trying provider', { requestId, provider: providerName });

        if (!provider.isAvailable()) {
          this.log('warn', 'Provider not available', { provider: providerName });
          continue;
        }

        const response = await this.executeWithTimeout(provider.sendRequest(request), strategy.timeout);
        this.log('info', 'Request successful', { requestId, provider: providerName, duration: response.duration });
        return response;
      } catch (error) {
        lastError = error as Error;
        this.log('warn', 'Provider failed', { requestId, provider: providerName, error: String(error) });

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    throw new Error(`All providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * Send request to specific provider
   */
  async sendRequestToProvider(providerName: string, prompt: string, options?: Partial<LLMRequest>): Promise<LLMResponse> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`);
    }

    const requestId = `req-${this.requestCounter++}`;
    const request: LLMRequest = {
      id: requestId,
      prompt,
      promptType: 'general',
      ...options,
      createdAt: new Date(),
    };

    this.log('info', 'Direct provider request', { requestId, provider: providerName });

    if (!provider.isAvailable()) {
      throw new Error(`Provider not available: ${providerName}`);
    }

    return provider.sendRequest(request);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isAvailable())
      .map(([name]) => name);
  }

  /**
   * Get all providers
   */
  getAllProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get model manager
   */
  getModelManager(): ModelManager {
    return this.modelManager;
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

  private initializeProviders(): void {
    // Register all providers with mock API keys for testing
    const manusConfig: LLMConfig = {
      provider: 'openai',
      model: 'gpt-4',
      apiKey: process.env.MANUS_API_KEY || 'mock-manus-key',
    };
    this.registerProvider('manus', new ManusAIProvider(manusConfig));

    const claudeConfig: LLMConfig = {
      provider: 'anthropic',
      model: 'claude-3',
      apiKey: process.env.CLAUDE_API_KEY || 'mock-claude-key',
    };
    this.registerProvider('claude', new ClaudeAIProvider(claudeConfig));

    const geminiConfig: LLMConfig = {
      provider: 'openai',
      model: 'gpt-4',
      apiKey: process.env.GEMINI_API_KEY || 'mock-gemini-key',
    };
    this.registerProvider('gemini', new GeminiAIProvider(geminiConfig));

    const deepseekConfig: LLMConfig = {
      provider: 'deepseek',
      model: 'deepseek-v3',
      apiKey: process.env.DEEPSEEK_API_KEY || 'mock-deepseek-key',
    };
    this.registerProvider('deepseek', new DeepSeekAIProvider(deepseekConfig));

    this.log('info', 'Providers initialized', { count: this.providers.size });
  }

  private initializeRoutingStrategies(): void {
    // General prompts: prefer Manus, fallback to Claude, Gemini, DeepSeek
    this.routingStrategies.set('general', {
      promptType: 'general',
      preferredModels: ['gpt-4', 'claude-3'],
      fallbackModels: ['deepseek-v3', 'gpt-3.5-turbo'],
      timeout: 30000,
      retryAttempts: 2,
      retryDelay: 1000,
    });

    // Coding: prefer DeepSeek Coder, then Codex, then Claude
    this.routingStrategies.set('coding', {
      promptType: 'coding',
      preferredModels: ['deepseek-coder', 'codex', 'claude-3'],
      fallbackModels: ['gpt-4', 'gpt-3.5-turbo'],
      timeout: 30000,
      retryAttempts: 2,
      retryDelay: 1000,
    });

    // Analysis: prefer Claude, then Manus
    this.routingStrategies.set('analysis', {
      promptType: 'analysis',
      preferredModels: ['claude-3', 'gpt-4'],
      fallbackModels: ['deepseek-v3', 'gpt-3.5-turbo'],
      timeout: 30000,
      retryAttempts: 2,
      retryDelay: 1000,
    });

    // Creative: prefer Claude, then Manus
    this.routingStrategies.set('creative', {
      promptType: 'creative',
      preferredModels: ['claude-3', 'gpt-4'],
      fallbackModels: ['deepseek-v3', 'gpt-3.5-turbo'],
      timeout: 30000,
      retryAttempts: 2,
      retryDelay: 1000,
    });

    // Debate: prefer Manus, then Claude
    this.routingStrategies.set('debate', {
      promptType: 'debate',
      preferredModels: ['gpt-4', 'claude-3'],
      fallbackModels: ['deepseek-v3', 'gpt-3.5-turbo'],
      timeout: 30000,
      retryAttempts: 2,
      retryDelay: 1000,
    });

    // Tool-use: prefer Manus, then DeepSeek
    this.routingStrategies.set('tool-use', {
      promptType: 'tool-use',
      preferredModels: ['gpt-4', 'deepseek-v3'],
      fallbackModels: ['claude-3', 'codex'],
      timeout: 30000,
      retryAttempts: 2,
      retryDelay: 1000,
    });

    // Context retrieval: prefer any available
    this.routingStrategies.set('context-retrieval', {
      promptType: 'context-retrieval',
      preferredModels: ['gpt-3.5-turbo', 'deepseek-coder'],
      fallbackModels: ['gpt-4', 'claude-3'],
      timeout: 15000,
      retryAttempts: 1,
      retryDelay: 500,
    });

    this.log('info', 'Routing strategies initialized', { count: this.routingStrategies.size });
  }

  private getProvidersForStrategy(strategy: RoutingStrategy): string[] {
    // Map models to providers
    const modelToProvider: Record<string, string> = {
      'gpt-4': 'manus',
      'gpt-3.5-turbo': 'manus',
      'codex': 'manus',
      'claude-3': 'claude',
      'deepseek-v3': 'deepseek',
      'deepseek-coder': 'deepseek',
    };

    const providers: string[] = [];

    // Add preferred providers
    for (const model of strategy.preferredModels) {
      const provider = modelToProvider[model];
      if (provider && !providers.includes(provider)) {
        providers.push(provider);
      }
    }

    // Add fallback providers
    for (const model of strategy.fallbackModels) {
      const provider = modelToProvider[model];
      if (provider && !providers.includes(provider)) {
        providers.push(provider);
      }
    }

    // Add all available providers as last resort
    for (const provider of this.getAvailableProviders()) {
      if (!providers.includes(provider)) {
        providers.push(provider);
      }
    }

    return providers;
  }

  private getDefaultStrategy(): RoutingStrategy {
    return {
      promptType: 'general',
      preferredModels: ['gpt-4', 'claude-3'],
      fallbackModels: ['deepseek-v3', 'gpt-3.5-turbo'],
      timeout: 30000,
      retryAttempts: 2,
      retryDelay: 1000,
    };
  }

  private executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Request timeout')), timeout)),
    ]);
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: Record<string, any>): void {
    const log: DebugLog = {
      level,
      message,
      timestamp: new Date(),
      context,
    };
    this.debugLogs.push(log);
    console.log(`[LLMRouter] [${level.toUpperCase()}] ${message}`, context);
  }
}
