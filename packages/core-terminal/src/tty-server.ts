/**
 * TTY Server
 * Handles terminal emulation and pseudo-terminal management
 */

import type { DebugLog } from './types';

export interface TTYSession {
  id: string;
  rows: number;
  cols: number;
  isActive: boolean;
  createdAt: Date;
}

export class TTYServer {
  private sessions: Map<string, TTYSession> = new Map();
  private debugLogs: DebugLog[] = [];
  private nextSessionId: number = 0;

  /**
   * Create a new TTY session
   */
  createSession(rows: number = 24, cols: number = 80): string {
    const sessionId = `session-${this.nextSessionId++}`;
    const session: TTYSession = {
      id: sessionId,
      rows,
      cols,
      isActive: true,
      createdAt: new Date(),
    };

    this.sessions.set(sessionId, session);
    this.log('info', 'TTY session created', { sessionId, rows, cols });
    return sessionId;
  }

  /**
   * Resize TTY session
   */
  resizeSession(sessionId: string, rows: number, cols: number): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.rows = rows;
    session.cols = cols;
    this.log('info', 'TTY session resized', { sessionId, rows, cols });
  }

  /**
   * Close TTY session
   */
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(sessionId);
      this.log('info', 'TTY session closed', { sessionId });
    }
  }

  /**
   * Get session info
   */
  getSession(sessionId: string): TTYSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): TTYSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.isActive);
  }

  /**
   * Send input to session
   */
  sendInput(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    this.log('debug', 'Input sent to session', { sessionId, dataLength: data.length });
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
    console.log(`[${level.toUpperCase()}] ${message}`, context);
  }
}
