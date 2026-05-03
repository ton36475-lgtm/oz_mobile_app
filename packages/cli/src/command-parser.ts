/**
 * Command Parser
 * Parses CLI arguments into structured commands
 */

import type { CLIArgs, CLICommand, DebugLog } from './types';

export class CommandParser {
  private debugLogs: DebugLog[] = [];

  /**
   * Parse raw CLI arguments
   */
  parseArgs(rawArgs: string[]): CLIArgs {
    this.log('debug', 'Parsing arguments', { count: rawArgs.length });

    const args: CLIArgs = {
      command: '',
      subcommand: undefined,
      options: {},
      positional: [],
      raw: rawArgs,
    };

    let i = 0;

    // Get command
    if (i < rawArgs.length && !rawArgs[i].startsWith('-')) {
      args.command = rawArgs[i];
      i++;
    }

    // Get subcommand
    if (i < rawArgs.length && !rawArgs[i].startsWith('-')) {
      args.subcommand = rawArgs[i];
      i++;
    }

    // Parse options and positional arguments
    while (i < rawArgs.length) {
      const arg = rawArgs[i];

      if (arg.startsWith('--')) {
        // Long option
        const [key, value] = arg.substring(2).split('=');
        if (value) {
          args.options[key] = this.parseValue(value);
        } else {
          // Check if next arg is value or another option
          if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('-')) {
            args.options[key] = this.parseValue(rawArgs[i + 1]);
            i++;
          } else {
            args.options[key] = true;
          }
        }
      } else if (arg.startsWith('-') && arg.length > 1) {
        // Short option
        const key = arg.substring(1);
        if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('-')) {
          args.options[key] = this.parseValue(rawArgs[i + 1]);
          i++;
        } else {
          args.options[key] = true;
        }
      } else {
        // Positional argument
        args.positional.push(arg);
      }

      i++;
    }

    this.log('info', 'Arguments parsed', { command: args.command, subcommand: args.subcommand, options: Object.keys(args.options).length });

    return args;
  }

  /**
   * Validate command against definition
   */
  validateCommand(command: CLICommand, args: CLIArgs): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required options
    if (command.options) {
      for (const option of command.options) {
        if (option.required && !(option.name in args.options) && !(option.shortName && option.shortName in args.options)) {
          errors.push(`Missing required option: --${option.name}`);
        }

        // Check option value type
        const optionValue = args.options[option.name] || args.options[option.shortName || ''];
        if (optionValue !== undefined && option.type === 'number' && typeof optionValue !== 'number') {
          errors.push(`Option --${option.name} must be a number`);
        }

        // Check choices
        if (option.choices && optionValue && !option.choices.includes(optionValue)) {
          errors.push(`Option --${option.name} must be one of: ${option.choices.join(', ')}`);
        }
      }
    }

    // Check subcommand if provided
    if (args.subcommand && command.subcommands) {
      const subcommand = command.subcommands.find((s) => s.name === args.subcommand);
      if (!subcommand) {
        errors.push(`Unknown subcommand: ${args.subcommand}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get help text for command
   */
  getHelpText(command: CLICommand): string {
    let help = `\n${command.name} - ${command.description}\n\n`;

    help += 'Usage:\n';
    help += `  oz ${command.name}`;

    if (command.subcommands && command.subcommands.length > 0) {
      help += ' <subcommand>';
    }

    if (command.options && command.options.length > 0) {
      help += ' [options]';
    }

    help += '\n\n';

    if (command.subcommands && command.subcommands.length > 0) {
      help += 'Subcommands:\n';
      for (const sub of command.subcommands) {
        help += `  ${sub.name.padEnd(20)} ${sub.description}\n`;
      }
      help += '\n';
    }

    if (command.options && command.options.length > 0) {
      help += 'Options:\n';
      for (const opt of command.options) {
        const shortName = opt.shortName ? `-${opt.shortName}, ` : '';
        const required = opt.required ? ' (required)' : '';
        help += `  ${shortName}--${opt.name.padEnd(15)} ${opt.description}${required}\n`;
      }
      help += '\n';
    }

    return help;
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

  private parseValue(value: string): any {
    // Try to parse as number
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }

    // Try to parse as boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Try to parse as JSON
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value);
      } catch {
        // Not JSON, return as string
      }
    }

    // Return as string
    return value;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    const log: DebugLog = {
      level,
      message,
      timestamp: new Date(),
      context,
    };
    this.debugLogs.push(log);
    console.log(`[CommandParser] [${level.toUpperCase()}] ${message}`, context);
  }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
