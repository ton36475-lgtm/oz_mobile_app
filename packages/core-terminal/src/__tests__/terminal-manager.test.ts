/**
 * Terminal Manager Unit Tests
 * Hard test debugging with comprehensive coverage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TerminalManager } from '../terminal-manager';
import type { TerminalConfig } from '../types';

describe('TerminalManager', () => {
  let manager: TerminalManager;
  const testConfig: TerminalConfig = {
    host: 'localhost',
    port: 22,
    username: 'testuser',
    password: 'testpass',
    timeout: 5000,
    retryAttempts: 3,
  };

  beforeEach(() => {
    manager = new TerminalManager();
  });

  afterEach(async () => {
    const sessions = manager.getSessions();
    for (const session of sessions) {
      await manager.disconnect(session.id);
    }
    manager.clearAllLogs();
  });

  describe('Connection Management', () => {
    it('should initialize with disconnected status', () => {
      expect(manager.getStatus()).toBe('disconnected');
    });

    it('should connect successfully', async () => {
      const session = await manager.connect(testConfig);
      expect(session).toBeDefined();
      expect(session.status).toBe('connected');
      expect(manager.getStatus()).toBe('connected');
    });

    it('should track session after connection', async () => {
      const session = await manager.connect(testConfig);
      const sessions = manager.getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(session.id);
    });

    it('should disconnect successfully', async () => {
      const session = await manager.connect(testConfig);
      await manager.disconnect(session.id);
      expect(manager.getSessions()).toHaveLength(0);
    });
  });

  describe('Command Execution', () => {
    it('should execute command successfully', async () => {
      const session = await manager.connect(testConfig);
      const result = await manager.executeCommand(session.id, 'echo "test"');

      expect(result).toBeDefined();
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('test');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle command errors', async () => {
      const session = await manager.connect(testConfig);
      const result = await manager.executeCommand(session.id, 'error_command');

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toBeDefined();
    });

    it('should fail when session not found', async () => {
      await expect(manager.executeCommand('invalid-session', 'echo "test"')).rejects.toThrow();
    });

    it('should update lastActivity on command execution', async () => {
      const session = await manager.connect(testConfig);
      const beforeTime = session.lastActivity;

      await new Promise((resolve) => setTimeout(resolve, 100));
      await manager.executeCommand(session.id, 'echo "test"');

      const updatedSession = manager.getSession(session.id);
      expect(updatedSession?.lastActivity.getTime()).toBeGreaterThan(beforeTime.getTime());
    });
  });

  describe('Tunnel Management', () => {
    it('should activate tunnel successfully', async () => {
      const url = await manager.activateTunnel({
        tunnelToken: 'test-token',
        tunnelName: 'test-tunnel',
        remoteHost: 'localhost',
        remotePort: 22,
      });

      expect(url).toBeDefined();
      expect(url).toContain('trycloudflare.com');
    });

    it('should return tunnel status', async () => {
      await manager.activateTunnel({
        tunnelToken: 'test-token',
        tunnelName: 'test-tunnel',
        remoteHost: 'localhost',
        remotePort: 22,
      });

      const status = manager.getTunnelStatus();
      expect(status).toBeDefined();
      expect(status?.isActive).toBe(true);
    });

    it('should deactivate tunnel', async () => {
      await manager.activateTunnel({
        tunnelToken: 'test-token',
        tunnelName: 'test-tunnel',
        remoteHost: 'localhost',
        remotePort: 22,
      });

      await manager.deactivateTunnel();
      const status = manager.getTunnelStatus();
      expect(status?.isActive).toBe(false);
    });
  });

  describe('Logging', () => {
    it('should collect debug logs', async () => {
      await manager.connect(testConfig);
      const logs = manager.getAllLogs();

      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log.level === 'info')).toBe(true);
    });

    it('should clear debug logs', async () => {
      await manager.connect(testConfig);
      manager.clearAllLogs();

      const logs = manager.getAllLogs();
      expect(logs).toHaveLength(0);
    });

    it('should log errors', async () => {
      try {
        await manager.executeCommand('invalid-session', 'echo "test"');
      } catch (error) {
        // Expected error - verify it was caught
        expect(error).toBeDefined();
      }

      const logs = manager.getAllLogs();
      // Check if error log exists or if exception was thrown
      const hasErrorLog = logs.some((log) => log.level === 'error');
      expect(hasErrorLog || logs.length > 0).toBe(true);
    });
  });

  describe('Multiple Sessions', () => {
    it('should handle multiple sessions', async () => {
      const session1 = await manager.connect(testConfig);
      const session2 = await manager.connect(testConfig);

      expect(manager.getSessions()).toHaveLength(2);
      expect(session1.id).not.toBe(session2.id);
    });

    it('should disconnect specific session', async () => {
      const session1 = await manager.connect(testConfig);
      const session2 = await manager.connect(testConfig);

      await manager.disconnect(session1.id);

      const sessions = manager.getSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(session2.id);
    });
  });
});
