/**
 * OZ CLI
 * Command-line interface with Warp Terminal integration
 */

import { CommandParser } from './command-parser';
import type { CLICommand, CLIResponse, CLIConfig, CLISession, DebugLog, OutputFormat } from './types';

export class OZCLI {
  private parser: CommandParser;
  private commands: Map<string, CLICommand> = new Map();
  private config: CLIConfig;
  private session: CLISession | null = null;
  private debugLogs: DebugLog[] = [];

  constructor(config?: Partial<CLIConfig>) {
    this.parser = new CommandParser();
    this.config = {
      apiUrl: 'http://localhost:3000',
      outputFormat: 'text',
      logLevel: 'info',
      theme: 'dark',
      interactive: true,
      warpIntegration: true,
      ...config,
    };
    this.log('info', 'OZ CLI initialized', { config: this.config });
  }

  /**
   * Register a command
   */
  registerCommand(command: CLICommand): void {
    this.commands.set(command.name, command);
    this.log('info', 'Command registered', { command: command.name });
  }

  /**
   * Execute CLI command
   */
  async execute(rawArgs: string[]): Promise<CLIResponse> {
    try {
      // Parse arguments
      const args = this.parser.parseArgs(rawArgs);
      this.log('info', 'Command execution started', { command: args.command });

      // Get command
      const command = this.commands.get(args.command);
      if (!command) {
        return this.errorResponse(`Unknown command: ${args.command}`, 1);
      }

      // Validate command
      const validation = this.parser.validateCommand(command, args);
      if (!validation.valid) {
        const help = this.parser.getHelpText(command);
        return this.errorResponse(`${validation.errors.join('\n')}\n${help}`, 1);
      }

      // Execute command
      let response: CLIResponse;
      if (args.subcommand && command.subcommands) {
        const subcommand = command.subcommands.find((s) => s.name === args.subcommand);
        if (subcommand) {
          response = await subcommand.handler(args);
        } else {
          return this.errorResponse(`Unknown subcommand: ${args.subcommand}`, 1);
        }
      } else {
        response = await command.handler(args);
      }

      this.log('info', 'Command execution completed', { command: args.command, success: response.success });

      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log('error', 'Command execution failed', { error: message });
      return this.errorResponse(`Command execution failed: ${message}`, 1);
    }
  }

  /**
   * Format response for output
   */
  formatResponse(response: CLIResponse): string {
    const format = this.config.outputFormat;

    if (!response.success && response.error) {
      return this.formatError(response.error, format);
    }

    if (response.data) {
      return this.formatData(response.data, format);
    }

    return response.message || 'Success';
  }

  /**
   * Start interactive shell
   */
  async startInteractiveShell(): Promise<void> {
    console.log('OZ CLI - Interactive Shell');
    console.log('Type "help" for available commands');
    console.log('Type "exit" to quit\n');

    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const prompt = (): void => {
      rl.question('oz> ', async (input: string) => {
        if (input.trim() === 'exit') {
          rl.close();
          return;
        }

        if (input.trim() === '') {
          prompt();
          return;
        }

        const args = input.trim().split(/\s+/);
        const response = await this.execute(args);
        console.log(this.formatResponse(response));
        console.log();

        prompt();
      });
    };

    prompt();
  }

  /**
   * Get available commands
   */
  getCommands(): CLICommand[] {
    return Array.from(this.commands.values());
  }

  /**
   * Get command by name
   */
  getCommand(name: string): CLICommand | undefined {
    return this.commands.get(name);
  }

  /**
   * Create session (for Warp Terminal integration)
   */
  createSession(userId?: string, token?: string): CLISession {
    const session: CLISession = {
      id: `session-${Date.now()}`,
      userId,
      token,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isActive: true,
    };

    this.session = session;
    this.log('info', 'Session created', { sessionId: session.id, userId });

    return session;
  }

  /**
   * Get current session
   */
  getSession(): CLISession | null {
    return this.session;
  }

  /**
   * Destroy session
   */
  destroySession(): void {
    if (this.session) {
      this.log('info', 'Session destroyed', { sessionId: this.session.id });
      this.session = null;
    }
  }

  /**
   * Get configuration
   */
  getConfig(): CLIConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<CLIConfig>): void {
    this.config = { ...this.config, ...updates };
    this.log('info', 'Configuration updated', { updates });
  }

  /**
   * Get debug logs
   */
  getLogs(): DebugLog[] {
    return [...this.debugLogs, ...this.parser.getLogs()];
  }

  /**
   * Clear debug logs
   */
  clearLogs(): void {
    this.debugLogs = [];
    this.parser.clearLogs();
  }

  // Private helper methods

  private errorResponse(error: string, exitCode: number): CLIResponse {
    return {
      success: false,
      error,
      exitCode,
    };
  }

  private formatError(error: string, format: OutputFormat): string {
    if (format === 'json') {
      return JSON.stringify({ error }, null, 2);
    }
    return `Error: ${error}`;
  }

  private formatData(data: any, format: OutputFormat): string {
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    if (format === 'table' && Array.isArray(data)) {
      return this.formatTable(data);
    }

    if (format === 'yaml') {
      return this.formatYAML(data);
    }

    // Default text format
    if (typeof data === 'object') {
      return JSON.stringify(data, null, 2);
    }

    return String(data);
  }

  private formatTable(data: any[]): string {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map((item) => headers.map((h) => String(item[h] || '')));

    // Calculate column widths
    const widths = headers.map((h, i) => Math.max(h.length, Math.max(...rows.map((r) => r[i].length))));

    // Format header
    let table = headers.map((h, i) => h.padEnd(widths[i])).join(' | ') + '\n';
    table += widths.map((w) => '-'.repeat(w)).join('-+-') + '\n';

    // Format rows
    table += rows.map((r) => r.map((cell, i) => cell.padEnd(widths[i])).join(' | ')).join('\n');

    return table;
  }

  private formatYAML(data: any, indent: number = 0): string {
    const prefix = ' '.repeat(indent);
    let yaml = '';

    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'object' && value !== null) {
          yaml += `${prefix}${key}:\n${this.formatYAML(value, indent + 2)}`;
        } else {
          yaml += `${prefix}${key}: ${value}\n`;
        }
      }
    } else {
      yaml = `${prefix}${data}\n`;
    }

    return yaml;
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: Record<string, any>): void {
    const log: DebugLog = {
      level,
      message,
      timestamp: new Date(),
      context,
    };
    this.debugLogs.push(log);
    console.log(`[OZCLI] [${level.toUpperCase()}] ${message}`, context);
  }
}
