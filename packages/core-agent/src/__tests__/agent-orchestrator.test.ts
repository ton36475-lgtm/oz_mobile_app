/**
 * Agent Orchestrator Unit Tests
 * Hard test debugging with comprehensive coverage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AgentOrchestrator } from '../agent-orchestrator';
import type { AgentConfig } from '../types';

describe('AgentOrchestrator', () => {
  let orchestrator: AgentOrchestrator;

  const createAgentConfig = (id: string, name: string, role: string): AgentConfig => ({
    id,
    name,
    role: role as any,
    model: 'gpt-4',
    systemPrompt: `You are a ${role} agent`,
    temperature: 0.7,
    maxTokens: 2000,
  });

  beforeEach(() => {
    orchestrator = new AgentOrchestrator();
  });

  afterEach(() => {
    orchestrator.clearAllLogs();
  });

  describe('Agent Management', () => {
    it('should create an agent', () => {
      const config = createAgentConfig('agent-1', 'Bull Agent', 'bull');
      const agent = orchestrator.createAgent(config);

      expect(agent).toBeDefined();
      expect(agent.config.id).toBe('agent-1');
      expect(agent.status).toBe('idle');
    });

    it('should get agent by ID', () => {
      const config = createAgentConfig('agent-1', 'Bull Agent', 'bull');
      orchestrator.createAgent(config);

      const agent = orchestrator.getAgent('agent-1');
      expect(agent).toBeDefined();
      expect(agent?.config.name).toBe('Bull Agent');
    });

    it('should get all agents', () => {
      orchestrator.createAgent(createAgentConfig('agent-1', 'Bull 1', 'bull'));
      orchestrator.createAgent(createAgentConfig('agent-2', 'Bull 2', 'bull'));
      orchestrator.createAgent(createAgentConfig('agent-3', 'Bear 1', 'bear'));

      const agents = orchestrator.getAllAgents();
      expect(agents).toHaveLength(3);
    });

    it('should get agents by role', () => {
      orchestrator.createAgent(createAgentConfig('agent-1', 'Bull 1', 'bull'));
      orchestrator.createAgent(createAgentConfig('agent-2', 'Bull 2', 'bull'));
      orchestrator.createAgent(createAgentConfig('agent-3', 'Bear 1', 'bear'));

      const bullAgents = orchestrator.getAgentsByRole('bull');
      expect(bullAgents).toHaveLength(2);

      const bearAgents = orchestrator.getAgentsByRole('bear');
      expect(bearAgents).toHaveLength(1);
    });

    it('should remove agent', () => {
      orchestrator.createAgent(createAgentConfig('agent-1', 'Bull Agent', 'bull'));
      expect(orchestrator.getAllAgents()).toHaveLength(1);

      orchestrator.removeAgent('agent-1');
      expect(orchestrator.getAllAgents()).toHaveLength(0);
    });

    it('should get pool statistics', () => {
      orchestrator.createAgent(createAgentConfig('agent-1', 'Bull 1', 'bull'));
      orchestrator.createAgent(createAgentConfig('agent-2', 'Bull 2', 'bull'));
      orchestrator.createAgent(createAgentConfig('agent-3', 'Bear 1', 'bear'));

      const stats = orchestrator.getPoolStats();
      expect(stats.totalAgents).toBe(3);
      expect(stats.activeAgents).toBe(3);
      expect(stats.agentsByRole['bull']).toBe(2);
      expect(stats.agentsByRole['bear']).toBe(1);
    });
  });

  describe('Communication', () => {
    it('should publish message', async () => {
      orchestrator.createAgent(createAgentConfig('agent-1', 'Agent 1', 'bull'));

      const messageId = await orchestrator.publishMessage('agent-1', { text: 'Hello' }, 'broadcast');
      expect(messageId).toBeDefined();
      expect(messageId).toMatch(/^msg-/);
    });

    it('should subscribe to messages', async () => {
      orchestrator.createAgent(createAgentConfig('agent-1', 'Agent 1', 'bull'));
      orchestrator.createAgent(createAgentConfig('agent-2', 'Agent 2', 'bear'));

      let receivedMessage: any = null;
      const unsubscribe = orchestrator.subscribeToMessages('agent-2', (message) => {
        receivedMessage = message;
      });

      await orchestrator.publishMessage('agent-1', { text: 'Hello' }, 'direct', 'agent-2');

      expect(receivedMessage).toBeDefined();
      expect(receivedMessage.content.text).toBe('Hello');

      unsubscribe();
    });

    it('should get message history', async () => {
      orchestrator.createAgent(createAgentConfig('agent-1', 'Agent 1', 'bull'));

      await orchestrator.publishMessage('agent-1', { text: 'Message 1' }, 'broadcast');
      await orchestrator.publishMessage('agent-1', { text: 'Message 2' }, 'broadcast');

      const history = orchestrator.getMessageHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Debate Management', () => {
    it('should create debate session', () => {
      orchestrator.createAgent(createAgentConfig('bull-1', 'Bull 1', 'bull'));
      orchestrator.createAgent(createAgentConfig('bear-1', 'Bear 1', 'bear'));
      orchestrator.createAgent(createAgentConfig('moderator', 'Moderator', 'moderator'));

      const session = orchestrator.createDebateSession(
        'Should AI be regulated?',
        ['bull-1'],
        ['bear-1'],
        'moderator',
      );

      expect(session).toBeDefined();
      expect(session.topic).toBe('Should AI be regulated?');
      expect(session.status).toBe('pending');
    });

    it('should start debate', async () => {
      orchestrator.createAgent(createAgentConfig('bull-1', 'Bull 1', 'bull'));
      orchestrator.createAgent(createAgentConfig('bear-1', 'Bear 1', 'bear'));
      orchestrator.createAgent(createAgentConfig('moderator', 'Moderator', 'moderator'));

      const session = orchestrator.createDebateSession(
        'Should AI be regulated?',
        ['bull-1'],
        ['bear-1'],
        'moderator',
      );

      await orchestrator.startDebate(session.id);

      const updatedSession = orchestrator.getDebateSession(session.id);
      expect(updatedSession?.status).toBe('completed');
      expect(updatedSession?.rounds.length).toBeGreaterThan(0);
    });

    it('should get debate summary', async () => {
      orchestrator.createAgent(createAgentConfig('bull-1', 'Bull 1', 'bull'));
      orchestrator.createAgent(createAgentConfig('bear-1', 'Bear 1', 'bear'));
      orchestrator.createAgent(createAgentConfig('moderator', 'Moderator', 'moderator'));

      const session = orchestrator.createDebateSession(
        'Should AI be regulated?',
        ['bull-1'],
        ['bear-1'],
        'moderator',
      );

      await orchestrator.startDebate(session.id);

      const summary = orchestrator.getDebateSummary(session.id);
      expect(summary).toBeDefined();
      expect(summary?.topic).toBe('Should AI be regulated?');
      expect(summary?.status).toBe('completed');
      expect(summary?.roundCount).toBeGreaterThan(0);
    });

    it('should get all debate sessions', () => {
      orchestrator.createAgent(createAgentConfig('bull-1', 'Bull 1', 'bull'));
      orchestrator.createAgent(createAgentConfig('bear-1', 'Bear 1', 'bear'));
      orchestrator.createAgent(createAgentConfig('moderator', 'Moderator', 'moderator'));

      orchestrator.createDebateSession('Topic 1', ['bull-1'], ['bear-1'], 'moderator');
      orchestrator.createDebateSession('Topic 2', ['bull-1'], ['bear-1'], 'moderator');

      const sessions = orchestrator.getAllDebateSessions();
      expect(sessions).toHaveLength(2);
    });
  });

  describe('Logging', () => {
    it('should collect debug logs', () => {
      orchestrator.createAgent(createAgentConfig('agent-1', 'Agent 1', 'bull'));

      const logs = orchestrator.getAllLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log.level === 'info')).toBe(true);
    });

    it('should clear debug logs', () => {
      orchestrator.createAgent(createAgentConfig('agent-1', 'Agent 1', 'bull'));
      orchestrator.clearAllLogs();

      const logs = orchestrator.getAllLogs();
      expect(logs).toHaveLength(0);
    });
  });
});
