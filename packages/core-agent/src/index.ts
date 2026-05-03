/**
 * Agent Orchestrator Package
 * Multi-agent orchestration, communication, and debate framework
 */

export { AgentOrchestrator } from './agent-orchestrator';
export { AgentPool } from './agent-pool';
export { CommunicationBus } from './communication-bus';
export { DebateEngine } from './debate-engine';
export type {
  Agent,
  AgentConfig,
  AgentRole,
  AgentStatus,
  DebateSession,
  DebateRound,
  DebateMessage,
  DebatePhase,
  CommunicationMessage,
  DebugLog,
} from './types';
