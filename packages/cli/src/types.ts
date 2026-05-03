/**
 * OZ CLI Types
 * Command definitions, options, and responses
 */

export type CommandType = 'terminal' | 'agent' | 'identity' | 'llm' | 'tool' | 'config' | 'help';
export type OutputFormat = 'text' | 'json' | 'table' | 'yaml';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface CLICommand {
  name: string;
  description: string;
  type: CommandType;
  subcommands?: CLISubcommand[];
  options?: CLIOption[];
  handler: (args: CLIArgs) => Promise<CLIResponse>;
}

export interface CLISubcommand {
  name: string;
  description: string;
  options?: CLIOption[];
  handler: (args: CLIArgs) => Promise<CLIResponse>;
}

export interface CLIOption {
  name: string;
  shortName?: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  required?: boolean;
  default?: any;
  choices?: any[];
}

export interface CLIArgs {
  command: string;
  subcommand?: string;
  options: Record<string, any>;
  positional: string[];
  raw: string[];
}

export interface CLIResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
  exitCode: number;
}

export interface CLIConfig {
  apiUrl: string;
  apiKey?: string;
  outputFormat: OutputFormat;
  logLevel: LogLevel;
  theme: 'light' | 'dark';
  interactive: boolean;
  warpIntegration: boolean;
}

export interface CLISession {
  id: string;
  userId?: string;
  token?: string;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface DebugLog {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}
