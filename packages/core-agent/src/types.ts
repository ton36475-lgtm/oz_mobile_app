/**
 * Agent Orchestrator Types
 */

export type AgentRole = 'bull' | 'bear' | 'neutral' | 'moderator';
export type AgentStatus = 'idle' | 'thinking' | 'debating' | 'error';
export type DebatePhase = 'opening' | 'argument' | 'counter' | 'rebuttal' | 'conclusion';

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface Agent {
  config: AgentConfig;
  status: AgentStatus;
  createdAt: Date;
  lastActivity: Date;
}

export interface DebateMessage {
  agentId: string;
  agentName: string;
  role: AgentRole;
  phase: DebatePhase;
  content: string;
  timestamp: Date;
  confidence: number;
}

export interface DebateRound {
  roundNumber: number;
  phase: DebatePhase;
  messages: DebateMessage[];
  startedAt: Date;
  completedAt?: Date;
}

export interface DebateSession {
  id: string;
  topic: string;
  bullTeam: Agent[];
  bearTeam: Agent[];
  moderator: Agent;
  rounds: DebateRound[];
  status: 'pending' | 'active' | 'completed';
  createdAt: Date;
  completedAt?: Date;
}

export interface CommunicationMessage {
  id: string;
  fromAgentId: string;
  toAgentId?: string;
  type: 'broadcast' | 'direct' | 'system';
  content: any;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high';
}

export interface DebugLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}
