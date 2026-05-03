/**
 * Identity Manager Unit Tests
 * Hard test debugging with comprehensive coverage
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { IdentityManager } from '../identity-manager';

describe('IdentityManager', () => {
  let manager: IdentityManager;

  beforeEach(() => {
    manager = new IdentityManager();
  });

  afterEach(() => {
    manager.clearAllLogs();
  });

  describe('User Profile Management', () => {
    it('should create user profile', () => {
      const user = manager.createUser('test@example.com', 'Test User');

      expect(user).toBeDefined();
      expect(user.email).toBe('test@example.com');
      expect(user.name).toBe('Test User');
      expect(user.role).toBe('user');
    });

    it('should get user profile', () => {
      const created = manager.createUser('test@example.com', 'Test User');
      const retrieved = manager.getUser(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.email).toBe('test@example.com');
    });

    it('should get user by email', () => {
      manager.createUser('test@example.com', 'Test User');
      const user = manager.getUserByEmail('test@example.com');

      expect(user).toBeDefined();
      expect(user?.email).toBe('test@example.com');
    });

    it('should update user profile', () => {
      const user = manager.createUser('test@example.com', 'Test User');
      const updated = manager.updateUser(user.id, { name: 'Updated User' });

      expect(updated.name).toBe('Updated User');
    });

    it('should delete user', () => {
      const user = manager.createUser('test@example.com', 'Test User');
      manager.deleteUser(user.id);

      const retrieved = manager.getUser(user.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Authentication', () => {
    it('should login with email', async () => {
      const session = await manager.loginWithEmail('test@example.com', 'password123', false);

      expect(session).toBeDefined();
      expect(session.credentials.provider).toBe('email');
      expect(session.rememberMe).toBe(false);
    });

    it('should login with email and remember me', async () => {
      const session = await manager.loginWithEmail('test@example.com', 'password123', true);

      expect(session.rememberMe).toBe(true);
      expect(session.expiresAt.getTime()).toBeGreaterThan(new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).getTime());
    });

    it('should login with GitHub', async () => {
      const session = await manager.loginWithGitHub('github_code_123', false);

      expect(session).toBeDefined();
      expect(session.credentials.provider).toBe('github');
    });

    it('should login with Google', async () => {
      const session = await manager.loginWithGoogle('google_id_token_123', false);

      expect(session).toBeDefined();
      expect(session.credentials.provider).toBe('google');
    });

    it('should login with SSO', async () => {
      const session = await manager.loginWithSSO('sso_token_123', false);

      expect(session).toBeDefined();
      expect(session.credentials.provider).toBe('sso');
    });

    it('should validate session', async () => {
      const session = await manager.loginWithEmail('test@example.com', 'password123', false);
      const isValid = manager.validateSession(session.id);

      expect(isValid).toBe(true);
    });

    it('should logout session', async () => {
      const session = await manager.loginWithEmail('test@example.com', 'password123', false);
      manager.logout(session.id);

      const isValid = manager.validateSession(session.id);
      expect(isValid).toBe(false);
    });

    it('should create and verify OTP', () => {
      const otp = manager.createOTPVerification('user-123', 'test@example.com');

      expect(otp).toBeDefined();
      expect(otp.isVerified).toBe(false);

      const verified = manager.verifyOTPCode(otp.id, otp.code);
      expect(verified.isVerified).toBe(true);
    });
  });

  describe('Bot Identity Management', () => {
    it('should create bot identity', () => {
      const bot = manager.createBotIdentity('user-123', 'telegram', '123456789', 'testbot');

      expect(bot).toBeDefined();
      expect(bot.platform).toBe('telegram');
      expect(bot.platformUserId).toBe('123456789');
      expect(bot.status).toBe('pending_binding');
    });

    it('should get bot identity', () => {
      const created = manager.createBotIdentity('user-123', 'telegram', '123456789', 'testbot');
      const retrieved = manager.getBotIdentity(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.platformUserId).toBe('123456789');
    });

    it('should get bot by platform ID (fixes ID persistence)', () => {
      manager.createBotIdentity('user-123', 'telegram', '123456789', 'testbot');
      const bot = manager.getBotByPlatformId('telegram', '123456789');

      expect(bot).toBeDefined();
      expect(bot?.platformUserId).toBe('123456789');
    });

    it('should get bots by user', () => {
      manager.createBotIdentity('user-123', 'telegram', '123456789', 'testbot1');
      manager.createBotIdentity('user-123', 'line', '987654321', 'testbot2');
      manager.createBotIdentity('user-456', 'telegram', '111111111', 'testbot3');

      const userBots = manager.getBotIdentitiesByUser('user-123');
      expect(userBots).toHaveLength(2);
    });

    it('should create bot binding', () => {
      const bot = manager.createBotIdentity('user-123', 'telegram', '123456789', 'testbot');
      const binding = manager.createBotBinding(bot.id, 'user-123');

      expect(binding).toBeDefined();
      expect(binding.isVerified).toBe(false);
      expect(binding.verificationCode).toBeDefined();
    });

    it('should verify bot binding', () => {
      const bot = manager.createBotIdentity('user-123', 'telegram', '123456789', 'testbot');
      const binding = manager.createBotBinding(bot.id, 'user-123');

      const verified = manager.verifyBotBinding(binding.id, binding.verificationCode);
      expect(verified.isVerified).toBe(true);

      const updatedBot = manager.getBotIdentity(bot.id);
      expect(updatedBot?.status).toBe('active');
    });

    it('should reset bot binding (fixes ID persistence)', () => {
      const bot = manager.createBotIdentity('user-123', 'telegram', '123456789', 'testbot');
      const binding = manager.createBotBinding(bot.id, 'user-123');

      manager.verifyBotBinding(binding.id, binding.verificationCode);
      expect(manager.getBotIdentity(bot.id)?.status).toBe('active');

      manager.resetBotBinding(bot.id);
      expect(manager.getBotIdentity(bot.id)?.status).toBe('pending_binding');
    });

    it('should delete bot identity', () => {
      const bot = manager.createBotIdentity('user-123', 'telegram', '123456789', 'testbot');
      manager.deleteBotIdentity(bot.id);

      const retrieved = manager.getBotIdentity(bot.id);
      expect(retrieved).toBeUndefined();
    });
  });

  describe('Logging', () => {
    it('should collect debug logs', () => {
      manager.createUser('test@example.com', 'Test User');

      const logs = manager.getAllLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs.some((log) => log.level === 'info')).toBe(true);
    });

    it('should clear debug logs', () => {
      manager.createUser('test@example.com', 'Test User');
      manager.clearAllLogs();

      const logs = manager.getAllLogs();
      expect(logs).toHaveLength(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete auth flow with bot binding', async () => {
      // 1. Create user
      const user = manager.createUser('test@example.com', 'Test User');
      expect(user).toBeDefined();

      // 2. Login
      const session = await manager.loginWithEmail('test@example.com', 'password123', true);
      expect(session).toBeDefined();

      // 3. Create bot identity
      const bot = manager.createBotIdentity(user.id, 'telegram', '123456789', 'testbot');
      expect(bot.status).toBe('pending_binding');

      // 4. Create binding
      const binding = manager.createBotBinding(bot.id, user.id);
      expect(binding.isVerified).toBe(false);

      // 5. Verify binding
      const verified = manager.verifyBotBinding(binding.id, binding.verificationCode);
      expect(verified.isVerified).toBe(true);

      // 6. Check bot is now active
      const activeBot = manager.getBotIdentity(bot.id);
      expect(activeBot?.status).toBe('active');

      // 7. Logout
      manager.logout(session.id);
      expect(manager.validateSession(session.id)).toBe(false);
    });
  });
});
