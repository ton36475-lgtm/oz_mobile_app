/**
 * Agent Orchestrator
 * Main orchestration layer for agents, communication, and debates
 */

import { AgentPool } from './agent-pool';
import { CommunicationBus } from './communication-bus';
import { DebateEngine } from './debate-engine';
import type { AgentConfig, Agent, DebateSession, DebugLog } from './types';

export class AgentOrchestrator {
  private agentPool: AgentPool;
  private communicationBus: CommunicationBus;
  private debateEngine: DebateEngine;
  private debugLogs: DebugLog[] = [];

  constructor() {
    this.agentPool = new AgentPool();
    this.communicationBus = new CommunicationBus();
    this.debateEngine = new DebateEngine(this.agentPool, this.communicationBus);
    this.log('info', 'AgentOrchestrator initialized');
  }

  /**
   * Create an agent
   */
  createAgent(config: AgentConfig): Agent {
    return this.agentPool.createAgent(config);
  }

  /**
   * Get agent
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agentPool.getAgent(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return this.agentPool.getAllAgents();
  }

  /**
   * Get agents by role
   */
  getAgentsByRole(role: string): Agent[] {
    return this.agentPool.getAgentsByRole(role);
  }

  /**
   * Remove agent
   */
  removeAgent(agentId: string): void {
    this.agentPool.removeAgent(agentId);
  }

  /**
   * Get agent pool statistics
   */
  getPoolStats(): {
    totalAgents: number;
    activeAgents: number;
    agentsByRole: Record<string, number>;
  } {
    return this.agentPool.getStats();
  }

  /**
   * Publish message through communication bus
   */
  async publishMessage(
    fromAgentId: string,
    content: any,
    type: 'broadcast' | 'direct' = 'broadcast',
    toAgentId?: string,
  ): Promise<string> {
    return this.communicationBus.publish({
      fromAgentId,
      toAgentId,
      type,
      content,
      priority: 'normal',
    });
  }

  /**
   * Subscribe to messages
   */
  subscribeToMessages(agentId: string, handler: (message: any) => void | Promise<void>): () => void {
    return this.communicationBus.subscribe(agentId, handler);
  }

  /**
   * Get message history
   */
  getMessageHistory(limit?: number) {
    return this.communicationBus.getMessageHistory(limit);
  }

  /**
   * Create debate session
   */
  createDebateSession(topic: string, bullTeamIds: string[], bearTeamIds: string[], moderatorId: string): DebateSession {
    const bullTeam = bullTeamIds.map((id) => this.agentPool.getAgent(id)).filter((a) => a) as Agent[];
    const bearTeam = bearTeamIds.map((id) => this.agentPool.getAgent(id)).filter((a) => a) as Agent[];
    const moderator = this.agentPool.getAgent(moderatorId);

    if (!moderator) {
      throw new Error(`Moderator ${moderatorId} not found`);
    }

    if (bullTeam.length === 0 || bearTeam.length === 0) {
      throw new Error('Bull team and bear team must have at least one agent');
    }

    return this.debateEngine.createSession(topic, bullTeam, bearTeam, moderator);
  }

  /**
   * Start debate
   */
  async startDebate(sessionId: string): Promise<void> {
    return this.debateEngine.startDebate(sessionId);
  }

  /**
   * Get debate session
   */
  getDebateSession(sessionId: string): DebateSession | undefined {
    return this.debateEngine.getSession(sessionId);
  }

  /**
   * Get all debate sessions
   */
  getAllDebateSessions(): DebateSession[] {
    return this.debateEngine.getAllSessions();
  }

  /**
   * Get debate summary
   */
  getDebateSummary(sessionId: string) {
    return this.debateEngine.getDebateSummary(sessionId);
  }

  /**
   * Get all debug logs
   */
  getAllLogs(): DebugLog[] {
    const logs = [...this.debugLogs];
    logs.push(...this.agentPool.getLogs());
    logs.push(...this.communicationBus.getLogs());
    logs.push(...this.debateEngine.getLogs());
    return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Clear all debug logs
   */
  clearAllLogs(): void {
    this.debugLogs = [];
    this.agentPool.clearLogs();
    this.communicationBus.clearLogs();
    this.debateEngine.clearLogs();
  }

  // Private helper methods

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: Record<string, any>): void {
    const log: DebugLog = {
      level,
      message,
      timestamp: new Date(),
      context,
    };
    this.debugLogs.push(log);
    console.log(`[AgentOrchestrator] [${level.toUpperCase()}] ${message}`, context);
  }
}
