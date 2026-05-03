/**
 * Debate Engine
 * Orchestrates multi-agent debates between Bull and Bear teams
 */

import type { DebateSession, DebateRound, DebateMessage, DebatePhase, Agent, DebugLog } from './types';
import { AgentPool } from './agent-pool';
import { CommunicationBus } from './communication-bus';

export class DebateEngine {
  private sessions: Map<string, DebateSession> = new Map();
  private agentPool: AgentPool;
  private communicationBus: CommunicationBus;
  private debugLogs: DebugLog[] = [];
  private sessionId: number = 0;

  constructor(agentPool: AgentPool, communicationBus: CommunicationBus) {
    this.agentPool = agentPool;
    this.communicationBus = communicationBus;
    this.log('info', 'DebateEngine initialized');
  }

  /**
   * Create a new debate session
   */
  createSession(topic: string, bullTeam: Agent[], bearTeam: Agent[], moderator: Agent): DebateSession {
    const sessionId = `debate-${this.sessionId++}`;

    const session: DebateSession = {
      id: sessionId,
      topic,
      bullTeam,
      bearTeam,
      moderator,
      rounds: [],
      status: 'pending',
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    this.log('info', 'Debate session created', {
      sessionId,
      topic,
      bullTeamSize: bullTeam.length,
      bearTeamSize: bearTeam.length,
    });

    return session;
  }

  /**
   * Start debate session
   */
  async startDebate(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status !== 'pending') {
      throw new Error(`Session ${sessionId} is not pending`);
    }

    session.status = 'active';
    this.log('info', 'Debate started', { sessionId, topic: session.topic });

    // Run debate rounds
    const phases: DebatePhase[] = ['opening', 'argument', 'counter', 'rebuttal', 'conclusion'];

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      await this.runRound(sessionId, i + 1, phase);
    }

    session.status = 'completed';
    session.completedAt = new Date();
    this.log('info', 'Debate completed', { sessionId });
  }

  /**
   * Get debate session
   */
  getSession(sessionId: string): DebateSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all sessions
   */
  getAllSessions(): DebateSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get debate summary
   */
  getDebateSummary(sessionId: string): {
    topic: string;
    status: string;
    roundCount: number;
    totalMessages: number;
    bullTeamMessages: number;
    bearTeamMessages: number;
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    let bullMessages = 0;
    let bearMessages = 0;

    session.rounds.forEach((round) => {
      round.messages.forEach((msg) => {
        if (msg.role === 'bull') bullMessages++;
        if (msg.role === 'bear') bearMessages++;
      });
    });

    return {
      topic: session.topic,
      status: session.status,
      roundCount: session.rounds.length,
      totalMessages: bullMessages + bearMessages,
      bullTeamMessages: bullMessages,
      bearTeamMessages: bearMessages,
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

  private async runRound(sessionId: string, roundNumber: number, phase: DebatePhase): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    const round: DebateRound = {
      roundNumber,
      phase,
      messages: [],
      startedAt: new Date(),
    };

    this.log('info', 'Round started', { sessionId, roundNumber, phase });

    // Simulate debate messages
    const bullMessage = await this.generateMessage(session.bullTeam[0], phase, 'bull', session.topic);
    const bearMessage = await this.generateMessage(session.bearTeam[0], phase, 'bear', session.topic);

    round.messages.push(bullMessage, bearMessage);
    round.completedAt = new Date();

    session.rounds.push(round);
    this.log('info', 'Round completed', { sessionId, roundNumber, messageCount: round.messages.length });
  }

  private async generateMessage(
    agent: Agent,
    phase: DebatePhase,
    role: 'bull' | 'bear',
    topic: string,
  ): Promise<DebateMessage> {
    // Simulate message generation
    await new Promise((resolve) => setTimeout(resolve, 100));

    const message: DebateMessage = {
      agentId: agent.config.id,
      agentName: agent.config.name,
      role,
      phase,
      content: `${agent.config.name} (${role}) argument in ${phase} phase about "${topic}"`,
      timestamp: new Date(),
      confidence: 0.75 + Math.random() * 0.25,
    };

    return message;
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: Record<string, any>): void {
    const log: DebugLog = {
      level,
      message,
      timestamp: new Date(),
      context,
    };
    this.debugLogs.push(log);
    console.log(`[DebateEngine] [${level.toUpperCase()}] ${message}`, context);
  }
}
