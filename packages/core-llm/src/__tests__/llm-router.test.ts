/**
 * LLM Router Unit Tests
 * Hard test debugging with comprehensive coverage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LLMRouter } from '../llm-router';
import { ModelManager } from '../model-manager';

describe('LLMRouter', () => {
  let router: LLMRouter;

  beforeEach(() => {
    router = new LLMRouter();
  });

  afterEach(() => {
    router.clearLogs();
  });

  describe('Provider Management', () => {
    it('should register providers', () => {
      const providers = router.getAllProviders();
      expect(providers).toContain('manus');
      expect(providers).toContain('claude');
      expect(providers).toContain('gemini');
      expect(providers).toContain('deepseek');
    });

    it('should get available providers', () => {
      const available = router.getAvailableProviders();
      expect(Array.isArray(available)).toBe(true);
    });

    it('should get all providers', () => {
      const all = router.getAllProviders();
      expect(all.length).toBeGreaterThan(0);
    });
  });

  describe('Request Routing', () => {
    it('should route general prompt', async () => {
      const response = await router.sendRequest('What is AI?', 'general');

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.usage).toBeDefined();
    });

    it('should route coding prompt', async () => {
      const response = await router.sendRequest('Write a function to sum numbers', 'coding');

      expect(response).toBeDefined();
      expect(response.content).toContain('Response');
    });

    it('should route analysis prompt', async () => {
      const response = await router.sendRequest('Analyze this data', 'analysis');

      expect(response).toBeDefined();
      expect(response.finishReason).toBe('stop');
    });

    it('should route creative prompt', async () => {
      const response = await router.sendRequest('Write a poem about AI', 'creative');

      expect(response).toBeDefined();
      expect(response.usage.totalTokens).toBeGreaterThan(0);
    });

    it('should route debate prompt', async () => {
      const response = await router.sendRequest('Argue for AI benefits', 'debate');

      expect(response).toBeDefined();
      expect(response.provider).toBeDefined();
    });

    it('should route tool-use prompt', async () => {
      const response = await router.sendRequest('Use the calculator tool', 'tool-use');

      expect(response).toBeDefined();
      expect(response.duration).toBeGreaterThan(0);
    });

    it('should route context-retrieval prompt', async () => {
      const response = await router.sendRequest('Retrieve context', 'context-retrieval');

      expect(response).toBeDefined();
      expect(response.createdAt).toBeDefined();
    });
  });

  describe('Direct Provider Requests', () => {
    it('should send request to Manus AI', async () => {
      const response = await router.sendRequestToProvider('manus', 'Test prompt');

      expect(response).toBeDefined();
      expect(response.provider).toBe('openai');
    });

    it('should send request to Claude AI', async () => {
      const response = await router.sendRequestToProvider('claude', 'Test prompt');

      expect(response).toBeDefined();
      expect(response.provider).toBe('anthropic');
    });

    it('should send request to Gemini AI', async () => {
      const response = await router.sendRequestToProvider('gemini', 'Test prompt');

      expect(response).toBeDefined();
      expect(response.content).toContain('Gemini');
    });

    it('should send request to DeepSeek AI', async () => {
      const response = await router.sendRequestToProvider('deepseek', 'Test prompt');

      expect(response).toBeDefined();
      expect(response.provider).toBe('deepseek');
    });

    it('should throw error for unknown provider', async () => {
      try {
        await router.sendRequestToProvider('unknown', 'Test prompt');
        expect.fail('Should throw error');
      } catch (error) {
        expect(String(error)).toContain('Provider not found');
      }
    });
  });

  describe('Model Manager Integration', () => {
    it('should get model manager', () => {
      const manager = router.getModelManager();
      expect(manager).toBeInstanceOf(ModelManager);
    });

    it('should get models by provider', () => {
      const manager = router.getModelManager();
      const openaiModels = manager.getModelsByProvider('openai');

      expect(openaiModels.length).toBeGreaterThan(0);
    });

    it('should get models by prompt type', () => {
      const manager = router.getModelManager();
      const codingModels = manager.getModelsByPromptType('coding');

      expect(codingModels.length).toBeGreaterThan(0);
    });

    it('should get best model for prompt type', () => {
      const manager = router.getModelManager();
      const bestModel = manager.getBestModelForPromptType('coding');

      expect(bestModel).toBeDefined();
      expect(bestModel?.supportedPromptTypes).toContain('coding');
    });

    it('should get models with function calling', () => {
      const manager = router.getModelManager();
      const models = manager.getModelsWithFunctionCalling();

      expect(models.length).toBeGreaterThan(0);
      expect(models.every((m) => m.supportsFunctionCalling)).toBe(true);
    });

    it('should get models with streaming', () => {
      const manager = router.getModelManager();
      const models = manager.getModelsWithStreaming();

      expect(models.length).toBeGreaterThan(0);
      expect(models.every((m) => m.supportsStreaming)).toBe(true);
    });
  });

  describe('Logging', () => {
    it('should collect debug logs', async () => {
      await router.sendRequest('Test prompt', 'general');

      const logs = router.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log.level === 'info')).toBe(true);
    });

    it('should clear debug logs', async () => {
      await router.sendRequest('Test prompt', 'general');
      router.clearLogs();

      const logs = router.getLogs();
      expect(logs).toHaveLength(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle multi-provider fallback', async () => {
      // Send request that should try multiple providers if needed
      const response = await router.sendRequest('Complex analysis task', 'analysis');

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.duration).toBeGreaterThan(0);
    });

    it('should handle request with custom options', async () => {
      const response = await router.sendRequest('Test prompt', 'coding', {
        maxTokens: 2000,
        temperature: 0.7,
      });

      expect(response).toBeDefined();
      expect(response.usage.totalTokens).toBeGreaterThan(0);
    });

    it('should handle multiple sequential requests', async () => {
      const response1 = await router.sendRequest('First prompt', 'general');
      const response2 = await router.sendRequest('Second prompt', 'coding');
      const response3 = await router.sendRequest('Third prompt', 'analysis');

      expect(response1.id).not.toBe(response2.id);
      expect(response2.id).not.toBe(response3.id);
      expect(response1.requestId).not.toBe(response2.requestId);
    });

    it('should handle different prompt types with appropriate routing', async () => {
      const prompts = [
        { text: 'General question', type: 'general' as const },
        { text: 'Write code', type: 'coding' as const },
        { text: 'Analyze data', type: 'analysis' as const },
        { text: 'Create story', type: 'creative' as const },
      ];

      for (const { text, type } of prompts) {
        const response = await router.sendRequest(text, type);
        expect(response).toBeDefined();
        expect(response.content).toBeDefined();
      }
    });
  });
});
