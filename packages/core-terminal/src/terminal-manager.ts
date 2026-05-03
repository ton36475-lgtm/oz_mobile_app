/**
 * Terminal Manager
 * Orchestrates SSH, Cloudflare Tunnel, and TTY Server
 */

import { SSHClient } from './ssh-client';
import { CloudflareTunnel, type TunnelConfig } from './cloudflare-tunnel';
import { TTYServer } from './tty-server';
import type { TerminalConfig, CommandResult, ConnectionStatus, TerminalSession, DebugLog } from './types';

export class TerminalManager {
  private sshClient: SSHClient | null = null;
  private tunnel: CloudflareTunnel | null = null;
  private ttyServer: TTYServer;
  private sessions: Map<string, TerminalSession> = new Map();
  private status: ConnectionStatus = 'disconnected';
  private debugLogs: DebugLog[] = [];

  constructor() {
    this.ttyServer = new TTYServer();
    this.log('info', 'TerminalManager initialized');
  }

  /**
   * Connect to a terminal
   */
  async connect(config: TerminalConfig): Promise<TerminalSession> {
    try {
      this.status = 'connecting';
      this.log('info', 'Connecting to terminal', { host: config.host });

      // Initialize SSH client
      this.sshClient = new SSHClient(config);
      await this.sshClient.connect();

      // Create TTY session
      const ttySessionId = this.ttyServer.createSession();

      // Create terminal session
      const sessionId = `term-${Date.now()}`;
      const session: TerminalSession = {
        id: sessionId,
        status: 'connected',
        config,
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      this.sessions.set(sessionId, session);
      this.status = 'connected';

      this.log('info', 'Terminal connected successfully', { sessionId });
      return session;
    } catch (error) {
      this.status = 'error';
      this.log('error', 'Terminal connection failed', { error: String(error) });
      throw error;
    }
  }

  /**
   * Execute command on terminal
   */
  async executeCommand(sessionId: string, command: string): Promise<CommandResult> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!this.sshClient) {
      throw new Error('SSH client not initialized');
    }

    try {
      const result = await this.sshClient.executeCommand(command);
      session.lastActivity = new Date();
      this.log('info', 'Command executed', { sessionId, command, exitCode: result.exitCode });
      return result;
    } catch (error) {
      this.log('error', 'Command execution failed', { sessionId, command, error: String(error) });
      throw error;
    }
  }

  /**
   * Activate Cloudflare Tunnel
   */
  async activateTunnel(config: TunnelConfig): Promise<string> {
    try {
      this.tunnel = new CloudflareTunnel(config);
      const url = await this.tunnel.activate();
      this.log('info', 'Tunnel activated', { url });
      return url;
    } catch (error) {
      this.log('error', 'Tunnel activation failed', { error: String(error) });
      throw error;
    }
  }

  /**
   * Deactivate Cloudflare Tunnel
   */
  async deactivateTunnel(): Promise<void> {
    if (this.tunnel) {
      await this.tunnel.deactivate();
      this.log('info', 'Tunnel deactivated');
    }
  }

  /**
   * Disconnect terminal
   */
  async disconnect(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'disconnected';
      this.sessions.delete(sessionId);
      this.log('info', 'Terminal disconnected', { sessionId });
    }

    if (this.sshClient) {
      await this.sshClient.disconnect();
      this.sshClient = null;
    }

    this.status = 'disconnected';
  }

  /**
   * Get terminal status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get all sessions
   */
  getSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get tunnel status
   */
  getTunnelStatus(): { isActive: boolean; url: string } | null {
    if (!this.tunnel) {
      return null;
    }
    return this.tunnel.getStatus();
  }

  /**
   * Get all debug logs
   */
  getAllLogs(): DebugLog[] {
    const logs = [...this.debugLogs];

    if (this.sshClient) {
      logs.push(...this.sshClient.getLogs());
    }

    if (this.tunnel) {
      logs.push(...this.tunnel.getLogs());
    }

    logs.push(...this.ttyServer.getLogs());

    return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Clear all debug logs
   */
  clearAllLogs(): void {
    this.debugLogs = [];
    this.sshClient?.clearLogs();
    this.tunnel?.clearLogs();
    this.ttyServer.clearLogs();
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
    console.log(`[TerminalManager] [${level.toUpperCase()}] ${message}`, context);
  }
}
