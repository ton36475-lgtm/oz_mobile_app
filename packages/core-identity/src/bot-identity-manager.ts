/**
 * Bot Identity Manager
 * Manages bot identities and binding (fixes ID persistence issue)
 */

import type { BotIdentity, BotBinding, DebugLog } from './types';

export class BotIdentityManager {
  private botIdentities: Map<string, BotIdentity> = new Map();
  private botBindings: Map<string, BotBinding> = new Map();
  private debugLogs: DebugLog[] = [];
  private nextBotId: number = 0;
  private nextBindingId: number = 0;

  /**
   * Create a new bot identity
   * Fixes: Bot ID persistence - stores bot info with unique ID
   */
  createBotIdentity(userId: string, platform: 'telegram' | 'line' | 'discord' | 'slack', platformUserId: string, platformUsername: string): BotIdentity {
    const botId = `bot-${this.nextBotId++}`;

    const botIdentity: BotIdentity = {
      id: botId,
      userId,
      platform,
      platformUserId,
      platformUsername,
      status: 'pending_binding',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.botIdentities.set(botId, botIdentity);
    this.log('info', 'Bot identity created', { botId, platform, platformUserId, platformUsername });
    return botIdentity;
  }

  /**
   * Get bot identity by ID
   */
  getBotIdentity(botId: string): BotIdentity | undefined {
    return this.botIdentities.get(botId);
  }

  /**
   * Get bot identities by user
   */
  getBotIdentitiesByUser(userId: string): BotIdentity[] {
    return Array.from(this.botIdentities.values()).filter((b) => b.userId === userId);
  }

  /**
   * Get bot identity by platform ID
   * Fixes: Bot ID persistence - retrieves bot by platform ID
   */
  getBotIdentityByPlatformId(platform: string, platformUserId: string): BotIdentity | undefined {
    return Array.from(this.botIdentities.values()).find((b) => b.platform === platform && b.platformUserId === platformUserId);
  }

  /**
   * Update bot identity status
   */
  updateBotStatus(botId: string, status: 'active' | 'inactive' | 'error' | 'pending_binding'): void {
    const bot = this.botIdentities.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    bot.status = status;
    bot.updatedAt = new Date();
    bot.lastSync = new Date();
    this.log('info', 'Bot status updated', { botId, status });
  }

  /**
   * Create bot binding verification
   * Fixes: Bot ID persistence - creates binding token for verification
   */
  createBotBinding(botId: string, userId: string): BotBinding {
    const bot = this.botIdentities.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    const bindingId = `binding-${this.nextBindingId++}`;
    const verificationCode = this.generateVerificationCode();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const binding: BotBinding = {
      id: bindingId,
      botIdentityId: botId,
      userId,
      verificationCode,
      verificationExpiresAt,
      isVerified: false,
      createdAt: new Date(),
    };

    this.botBindings.set(bindingId, binding);
    bot.bindingToken = verificationCode;
    bot.bindingExpiresAt = verificationExpiresAt;

    this.log('info', 'Bot binding created', { bindingId, botId, verificationCode });
    return binding;
  }

  /**
   * Verify bot binding
   * Fixes: Bot ID persistence - verifies and activates bot binding
   */
  verifyBotBinding(bindingId: string, verificationCode: string): BotBinding {
    const binding = this.botBindings.get(bindingId);
    if (!binding) {
      throw new Error(`Binding ${bindingId} not found`);
    }

    if (binding.isVerified) {
      throw new Error(`Binding ${bindingId} already verified`);
    }

    if (new Date() > binding.verificationExpiresAt) {
      throw new Error(`Binding ${bindingId} verification expired`);
    }

    if (binding.verificationCode !== verificationCode) {
      throw new Error(`Invalid verification code`);
    }

    binding.isVerified = true;
    binding.verifiedAt = new Date();

    // Update bot status to active
    const bot = this.botIdentities.get(binding.botIdentityId);
    if (bot) {
      bot.status = 'active';
      bot.bindingToken = undefined;
      bot.bindingExpiresAt = undefined;
      bot.updatedAt = new Date();
    }

    this.log('info', 'Bot binding verified', { bindingId, botId: binding.botIdentityId });
    return binding;
  }

  /**
   * Reset bot binding
   * Fixes: Bot ID persistence - resets binding for re-binding with new account
   */
  resetBotBinding(botId: string): void {
    const bot = this.botIdentities.get(botId);
    if (!bot) {
      throw new Error(`Bot ${botId} not found`);
    }

    // Clear old bindings
    const oldBindings = Array.from(this.botBindings.entries()).filter(([_, b]) => b.botIdentityId === botId);
    oldBindings.forEach(([bindingId]) => {
      this.botBindings.delete(bindingId);
    });

    bot.status = 'pending_binding';
    bot.bindingToken = undefined;
    bot.bindingExpiresAt = undefined;
    bot.updatedAt = new Date();

    this.log('info', 'Bot binding reset', { botId });
  }

  /**
   * Get bot binding by ID
   */
  getBotBinding(bindingId: string): BotBinding | undefined {
    return this.botBindings.get(bindingId);
  }

  /**
   * Get bot bindings by user
   */
  getBotBindingsByUser(userId: string): BotBinding[] {
    return Array.from(this.botBindings.values()).filter((b) => b.userId === userId);
  }

  /**
   * Delete bot identity
   */
  deleteBotIdentity(botId: string): void {
    if (this.botIdentities.delete(botId)) {
      // Also delete associated bindings
      const bindingsToDelete = Array.from(this.botBindings.entries()).filter(([_, b]) => b.botIdentityId === botId);
      bindingsToDelete.forEach(([bindingId]) => {
        this.botBindings.delete(bindingId);
      });

      this.log('info', 'Bot identity deleted', { botId });
    }
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

  private generateVerificationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: Record<string, any>): void {
    const log: DebugLog = {
      level,
      message,
      timestamp: new Date(),
      context,
    };
    this.debugLogs.push(log);
    console.log(`[BotIdentityManager] [${level.toUpperCase()}] ${message}`, context);
  }
}
