/**
 * Identity Manager
 * Main orchestration layer for user profiles, auth, and bot binding
 */

import { UserProfileService } from './user-profile-service';
import { BotIdentityManager } from './bot-identity-manager';
import { AuthService } from './auth-service';
import type { UserProfile, BotIdentity, AuthSession, OTPVerification, DebugLog } from './types';

export class IdentityManager {
  private userProfileService: UserProfileService;
  private botIdentityManager: BotIdentityManager;
  private authService: AuthService;
  private debugLogs: DebugLog[] = [];

  constructor() {
    this.userProfileService = new UserProfileService();
    this.botIdentityManager = new BotIdentityManager();
    this.authService = new AuthService();
    this.log('info', 'IdentityManager initialized');
  }

  // User Profile Management

  /**
   * Create user profile
   */
  createUser(email: string, name: string): UserProfile {
    return this.userProfileService.createProfile(email, name);
  }

  /**
   * Get user profile
   */
  getUser(userId: string): UserProfile | undefined {
    return this.userProfileService.getProfile(userId);
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): UserProfile | undefined {
    return this.userProfileService.getProfileByEmail(email);
  }

  /**
   * Update user profile
   */
  updateUser(userId: string, updates: Partial<UserProfile>): UserProfile {
    return this.userProfileService.updateProfile(userId, updates);
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): void {
    this.userProfileService.deleteProfile(userId);
  }

  // Authentication

  /**
   * Login with email
   */
  async loginWithEmail(email: string, password: string, rememberMe: boolean = false): Promise<AuthSession> {
    const session = await this.authService.createEmailSession(email, password, rememberMe);
    this.userProfileService.updateLastLogin(session.userId);
    return session;
  }

  /**
   * Login with GitHub
   */
  async loginWithGitHub(code: string, rememberMe: boolean = false): Promise<AuthSession> {
    const session = await this.authService.createGitHubSession(code, rememberMe);
    this.userProfileService.updateLastLogin(session.userId);
    return session;
  }

  /**
   * Login with Google
   */
  async loginWithGoogle(idToken: string, rememberMe: boolean = false): Promise<AuthSession> {
    const session = await this.authService.createGoogleSession(idToken, rememberMe);
    this.userProfileService.updateLastLogin(session.userId);
    return session;
  }

  /**
   * Login with SSO
   */
  async loginWithSSO(ssoToken: string, rememberMe: boolean = false): Promise<AuthSession> {
    const session = await this.authService.createSSOSession(ssoToken, rememberMe);
    this.userProfileService.updateLastLogin(session.userId);
    return session;
  }

  /**
   * Get auth session
   */
  getSession(sessionId: string): AuthSession | undefined {
    return this.authService.getSession(sessionId);
  }

  /**
   * Validate session
   */
  validateSession(sessionId: string): boolean {
    return this.authService.validateSession(sessionId);
  }

  /**
   * Refresh session
   */
  refreshSession(sessionId: string): AuthSession | undefined {
    return this.authService.refreshSession(sessionId);
  }

  /**
   * Logout
   */
  logout(sessionId: string): void {
    this.authService.logout(sessionId);
  }

  /**
   * Create OTP verification
   */
  createOTPVerification(userId: string, email: string): OTPVerification {
    return this.authService.createOTPVerification(userId, email);
  }

  /**
   * Verify OTP code
   */
  verifyOTPCode(otpId: string, code: string): OTPVerification {
    return this.authService.verifyOTPCode(otpId, code);
  }

  // Bot Identity Management

  /**
   * Create bot identity
   */
  createBotIdentity(userId: string, platform: 'telegram' | 'line' | 'discord' | 'slack', platformUserId: string, platformUsername: string): BotIdentity {
    return this.botIdentityManager.createBotIdentity(userId, platform, platformUserId, platformUsername);
  }

  /**
   * Get bot identity
   */
  getBotIdentity(botId: string): BotIdentity | undefined {
    return this.botIdentityManager.getBotIdentity(botId);
  }

  /**
   * Get bot identities by user
   */
  getBotIdentitiesByUser(userId: string): BotIdentity[] {
    return this.botIdentityManager.getBotIdentitiesByUser(userId);
  }

  /**
   * Get bot by platform ID (fixes ID persistence)
   */
  getBotByPlatformId(platform: string, platformUserId: string): BotIdentity | undefined {
    return this.botIdentityManager.getBotIdentityByPlatformId(platform, platformUserId);
  }

  /**
   * Create bot binding
   */
  createBotBinding(botId: string, userId: string) {
    return this.botIdentityManager.createBotBinding(botId, userId);
  }

  /**
   * Verify bot binding
   */
  verifyBotBinding(bindingId: string, verificationCode: string) {
    return this.botIdentityManager.verifyBotBinding(bindingId, verificationCode);
  }

  /**
   * Reset bot binding (fixes ID persistence issue)
   */
  resetBotBinding(botId: string): void {
    this.botIdentityManager.resetBotBinding(botId);
  }

  /**
   * Delete bot identity
   */
  deleteBotIdentity(botId: string): void {
    this.botIdentityManager.deleteBotIdentity(botId);
  }

  /**
   * Get all debug logs
   */
  getAllLogs(): DebugLog[] {
    const logs = [...this.debugLogs];
    logs.push(...this.userProfileService.getLogs());
    logs.push(...this.botIdentityManager.getLogs());
    logs.push(...this.authService.getLogs());
    return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Clear all debug logs
   */
  clearAllLogs(): void {
    this.debugLogs = [];
    this.userProfileService.clearLogs();
    this.botIdentityManager.clearLogs();
    this.authService.clearLogs();
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
    console.log(`[IdentityManager] [${level.toUpperCase()}] ${message}`, context);
  }
}
