/**
 * Terminal Manager Types
 */

export interface TerminalConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  timeout: number;
  retryAttempts: number;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
  timestamp: Date;
}

export interface TerminalSession {
  id: string;
  status: ConnectionStatus;
  config: TerminalConfig;
  createdAt: Date;
  lastActivity: Date;
}

export interface DebugLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}
