/**
 * Agent Pool Manager
 * Manages agent lifecycle and pool operations
 */

import type { Agent, AgentConfig, AgentStatus, DebugLog } from './types';

export class AgentPool {
  private agents: Map<string, Agent> = new Map();
  private debugLogs: DebugLog[] = [];

  /**
   * Create and register an agent
   */
  createAgent(config: AgentConfig): Agent {
    if (this.agents.has(config.id)) {
      throw new Error(`Agent ${config.id} already exists`);
    }

    const agent: Agent = {
      config,
      status: 'idle',
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    this.agents.set(config.id, agent);
    this.log('info', 'Agent created', { agentId: config.id, name: config.name, role: config.role });
    return agent;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get agents by role
   */
  getAgentsByRole(role: string): Agent[] {
    return Array.from(this.agents.values()).filter((a) => a.config.role === role);
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, status: AgentStatus): void {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    agent.status = status;
    agent.lastActivity = new Date();
    this.log('debug', 'Agent status updated', { agentId, status });
  }

  /**
   * Remove agent from pool
   */
  removeAgent(agentId: string): void {
    if (this.agents.delete(agentId)) {
      this.log('info', 'Agent removed', { agentId });
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalAgents: number;
    activeAgents: number;
    agentsByRole: Record<string, number>;
  } {
    const agents = Array.from(this.agents.values());
    const activeAgents = agents.filter((a) => a.status !== 'error').length;
    const agentsByRole: Record<string, number> = {};

    agents.forEach((agent) => {
      const role = agent.config.role;
      agentsByRole[role] = (agentsByRole[role] || 0) + 1;
    });

    return {
      totalAgents: agents.length,
      activeAgents,
      agentsByRole,
    };
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

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: Record<string, any>): void {
    const log: DebugLog = {
      level,
      message,
      timestamp: new Date(),
      context,
    };
    this.debugLogs.push(log);
    console.log(`[AgentPool] [${level.toUpperCase()}] ${message}`, context);
  }
}
