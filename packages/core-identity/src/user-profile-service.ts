/**
 * User Profile Service
 * Manages user profiles and account information
 */

import type { UserProfile, DebugLog } from './types';

export class UserProfileService {
  private profiles: Map<string, UserProfile> = new Map();
  private debugLogs: DebugLog[] = [];
  private nextUserId: number = 0;

  /**
   * Create a new user profile
   */
  createProfile(email: string, name: string): UserProfile {
    const userId = `user-${this.nextUserId++}`;

    const profile: UserProfile = {
      id: userId,
      email,
      name,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.profiles.set(userId, profile);
    this.log('info', 'User profile created', { userId, email, name });
    return profile;
  }

  /**
   * Get user profile by ID
   */
  getProfile(userId: string): UserProfile | undefined {
    return this.profiles.get(userId);
  }

  /**
   * Get user profile by email
   */
  getProfileByEmail(email: string): UserProfile | undefined {
    return Array.from(this.profiles.values()).find((p) => p.email === email);
  }

  /**
   * Update user profile
   */
  updateProfile(userId: string, updates: Partial<UserProfile>): UserProfile {
    const profile = this.profiles.get(userId);
    if (!profile) {
      throw new Error(`User ${userId} not found`);
    }

    const updated: UserProfile = {
      ...profile,
      ...updates,
      id: profile.id,
      createdAt: profile.createdAt,
      updatedAt: new Date(),
    };

    this.profiles.set(userId, updated);
    this.log('info', 'User profile updated', { userId, updates: Object.keys(updates) });
    return updated;
  }

  /**
   * Update last login
   */
  updateLastLogin(userId: string): void {
    const profile = this.profiles.get(userId);
    if (profile) {
      profile.lastLogin = new Date();
      this.log('debug', 'Last login updated', { userId });
    }
  }

  /**
   * Delete user profile
   */
  deleteProfile(userId: string): void {
    if (this.profiles.delete(userId)) {
      this.log('info', 'User profile deleted', { userId });
    }
  }

  /**
   * Get all user profiles
   */
  getAllProfiles(): UserProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get user count
   */
  getUserCount(): number {
    return this.profiles.size;
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

  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, context?: Record<string, any>): void {
    const log: DebugLog = {
      level,
      message,
      timestamp: new Date(),
      context,
    };
    this.debugLogs.push(log);
    console.log(`[UserProfileService] [${level.toUpperCase()}] ${message}`, context);
  }
}
