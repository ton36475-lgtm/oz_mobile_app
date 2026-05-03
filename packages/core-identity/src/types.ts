/**
 * Identity Manager Types
 * User profiles, bot binding, and authentication
 */

export type AuthProvider = 'email' | 'github' | 'google' | 'sso' | 'telegram' | 'line';
export type UserRole = 'user' | 'admin' | 'bot' | 'moderator';
export type BotStatus = 'active' | 'inactive' | 'error' | 'pending_binding';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface AuthCredentials {
  provider: AuthProvider;
  providerId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface AuthSession {
  id: string;
  userId: string;
  credentials: AuthCredentials;
  createdAt: Date;
  expiresAt: Date;
  rememberMe: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface BotIdentity {
  id: string;
  userId: string;
  platform: 'telegram' | 'line' | 'discord' | 'slack';
  platformUserId: string;
  platformUsername: string;
  status: BotStatus;
  bindingToken?: string;
  bindingExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastSync?: Date;
}

export interface BotBinding {
  id: string;
  botIdentityId: string;
  userId: string;
  verificationCode: string;
  verificationExpiresAt: Date;
  isVerified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface OTPVerification {
  id: string;
  userId: string;
  email: string;
  code: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isVerified: boolean;
  verifiedAt?: Date;
  createdAt: Date;
}

export interface DebugLog {
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}
