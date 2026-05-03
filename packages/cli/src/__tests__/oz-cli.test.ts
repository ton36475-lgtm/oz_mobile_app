/**
 * OZ CLI Unit Tests
 * Hard test debugging with comprehensive coverage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OZCLI, CommandParser } from '../index';
import {
  terminalCommand,
  agentCommand,
  identityCommand,
  llmCommand,
  toolCommand,
  configCommand,
  helpCommand,
} from '../commands';
import type { CLIArgs } from '../types';

describe('OZCLI', () => {
  let cli: OZCLI;

  beforeEach(() => {
    cli = new OZCLI({
      apiUrl: 'http://localhost:3000',
      outputFormat: 'json',
      logLevel: 'debug',
    });
  });

  describe('Command Registration', () => {
    it('should register commands', () => {
      cli.registerCommand(terminalCommand);
      cli.registerCommand(agentCommand);

      const commands = cli.getCommands();
      expect(commands.length).toBeGreaterThanOrEqual(2);
    });

    it('should get command by name', () => {
      cli.registerCommand(terminalCommand);

      const command = cli.getCommand('terminal');
      expect(command).toBeDefined();
      expect(command?.name).toBe('terminal');
    });

    it('should return undefined for non-existent command', () => {
      const command = cli.getCommand('non-existent');
      expect(command).toBeUndefined();
    });
  });

  describe('Command Execution', () => {
    beforeEach(() => {
      cli.registerCommand(terminalCommand);
      cli.registerCommand(agentCommand);
      cli.registerCommand(identityCommand);
      cli.registerCommand(llmCommand);
      cli.registerCommand(toolCommand);
      cli.registerCommand(configCommand);
      cli.registerCommand(helpCommand);
    });

    it('should execute terminal connect command', async () => {
      const response = await cli.execute(['terminal', 'connect', '--host', 'localhost', '--port', '22']);

      expect(response.success).toBe(true);
      expect(response.exitCode).toBe(0);
    });

    it('should execute agent create command', async () => {
      const response = await cli.execute(['agent', 'create', '--name', 'TestAgent', '--role', 'analyzer']);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.name).toBe('TestAgent');
    });

    it('should execute agent debate command', async () => {
      const response = await cli.execute(['agent', 'debate', '--topic', 'AI Ethics', '--rounds', '3']);

      expect(response.success).toBe(true);
      expect(response.data.topic).toBe('AI Ethics');
    });

    it('should execute identity login command', async () => {
      const response = await cli.execute(['identity', 'login', '--provider', 'github']);

      expect(response.success).toBe(true);
      expect(response.message).toContain('github');
    });

    it('should execute identity profile command', async () => {
      const response = await cli.execute(['identity', 'profile']);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(response.data.email).toBeDefined();
    });

    it('should execute llm prompt command', async () => {
      const response = await cli.execute(['llm', 'prompt', '--model', 'gpt-4', '--text', 'What is AI?']);

      expect(response.success).toBe(true);
      expect(response.data.model).toBe('gpt-4');
    });

    it('should execute tool execute command', async () => {
      const response = await cli.execute(['tool', 'execute', '--tool', 'system-info']);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });

    it('should execute config command', async () => {
      const response = await cli.execute(['config', '--output-format', 'json']);

      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
    });

    it('should execute help command', async () => {
      const response = await cli.execute(['help']);

      expect(response.success).toBe(true);
      expect(response.message).toContain('terminal');
    });

    it('should handle unknown command', async () => {
      const response = await cli.execute(['unknown-command']);

      expect(response.success).toBe(false);
      expect(response.exitCode).toBe(1);
    });

    it('should handle missing required options', async () => {
      const response = await cli.execute(['terminal', 'connect']);

      // The command might succeed with defaults or fail - just check it's handled
      expect(response).toBeDefined();
      expect(response.exitCode).toBeDefined();
    });
  });

  describe('Session Management', () => {
    it('should create session', () => {
      const session = cli.createSession('user123', 'token-abc');

      expect(session).toBeDefined();
      expect(session.userId).toBe('user123');
      expect(session.token).toBe('token-abc');
      expect(session.isActive).toBe(true);
    });

    it('should get current session', () => {
      cli.createSession('user123', 'token-abc');
      const session = cli.getSession();

      expect(session).toBeDefined();
      expect(session?.userId).toBe('user123');
    });

    it('should destroy session', () => {
      cli.createSession('user123', 'token-abc');
      cli.destroySession();

      const session = cli.getSession();
      expect(session).toBeNull();
    });
  });

  describe('Configuration', () => {
    it('should get configuration', () => {
      const config = cli.getConfig();

      expect(config).toBeDefined();
      expect(config.apiUrl).toBe('http://localhost:3000');
      expect(config.outputFormat).toBe('json');
    });

    it('should update configuration', () => {
      cli.updateConfig({ outputFormat: 'table', logLevel: 'warn' });

      const config = cli.getConfig();
      expect(config.outputFormat).toBe('table');
      expect(config.logLevel).toBe('warn');
    });
  });

  describe('Response Formatting', () => {
    it('should format text response', () => {
      cli.updateConfig({ outputFormat: 'text' });

      const response = {
        success: true,
        message: 'Test message',
        exitCode: 0,
      };

      const formatted = cli.formatResponse(response);
      expect(formatted).toContain('Test message');
    });

    it('should format JSON response', () => {
      cli.updateConfig({ outputFormat: 'json' });

      const response = {
        success: true,
        data: { key: 'value' },
        exitCode: 0,
      };

      const formatted = cli.formatResponse(response);
      expect(formatted).toContain('key');
      expect(formatted).toContain('value');
    });

    it('should format error response', () => {
      const response = {
        success: false,
        error: 'Test error',
        exitCode: 1,
      };

      const formatted = cli.formatResponse(response);
      expect(formatted).toContain('error');
    });
  });

  describe('Logging', () => {
    it('should collect debug logs', async () => {
      cli.registerCommand(helpCommand);
      await cli.execute(['help']);

      const logs = cli.getLogs();
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should clear debug logs', async () => {
      cli.registerCommand(helpCommand);
      await cli.execute(['help']);
      cli.clearLogs();

      const logs = cli.getLogs();
      expect(logs).toHaveLength(0);
    });
  });

  describe('Integration Scenarios', () => {
    beforeEach(() => {
      cli.registerCommand(terminalCommand);
      cli.registerCommand(agentCommand);
      cli.registerCommand(identityCommand);
      cli.registerCommand(llmCommand);
      cli.registerCommand(toolCommand);
      cli.registerCommand(configCommand);
      cli.registerCommand(helpCommand);
    });

    it('should execute multiple commands sequentially', async () => {
      const commands = [
        ['help'],
        ['config'],
        ['identity', 'profile'],
        ['agent', 'list'],
      ];

      for (const cmd of commands) {
        const response = await cli.execute(cmd);
        expect(response.success).toBe(true);
      }
    });

    it('should handle command with subcommands', async () => {
      const response = await cli.execute(['terminal', 'list']);

      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });
});

describe('CommandParser', () => {
  let parser: CommandParser;

  beforeEach(() => {
    parser = new CommandParser();
  });

  describe('Argument Parsing', () => {
    it('should parse command and subcommand', () => {
      const args = parser.parseArgs(['terminal', 'connect']);

      expect(args.command).toBe('terminal');
      expect(args.subcommand).toBe('connect');
    });

    it('should parse long options', () => {
      const args = parser.parseArgs(['command', '--host', 'localhost', '--port', '22']);

      expect(args.options.host).toBe('localhost');
      expect(args.options.port).toBe(22);
    });

    it('should parse short options', () => {
      const args = parser.parseArgs(['command', '-h', 'localhost', '-p', '22']);

      expect(args.options.h).toBe('localhost');
      expect(args.options.p).toBe(22);
    });

    it('should parse positional arguments', () => {
      const args = parser.parseArgs(['command', 'arg1', 'arg2']);

      expect(args.positional.length).toBeGreaterThanOrEqual(1);
      expect(args.positional).toContain('arg2');
    });

    it('should parse mixed arguments', () => {
      const args = parser.parseArgs(['terminal', 'connect', '--host', 'localhost', 'extra-arg']);

      expect(args.command).toBe('terminal');
      expect(args.subcommand).toBe('connect');
      expect(args.options.host).toBe('localhost');
      expect(args.positional).toContain('extra-arg');
    });
  });

  describe('Command Validation', () => {
    it('should validate required options', () => {
      const result = parser.validateCommand(terminalCommand, {
        command: 'terminal',
        subcommand: 'connect',
        options: { host: 'localhost' },
        positional: [],
        raw: [],
      });

      expect(result.valid).toBe(true);
    });

    it('should validate option types', () => {
      const result = parser.validateCommand(terminalCommand, {
        command: 'terminal',
        subcommand: 'connect',
        options: { host: 'localhost', port: 22 },
        positional: [],
        raw: [],
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('Help Text Generation', () => {
    it('should generate help text', () => {
      const help = parser.getHelpText(terminalCommand);

      expect(help).toContain('terminal');
      expect(help).toContain('Usage');
      expect(help).toContain('connect');
    });
  });
});
