/**
 * Identity Manager Package
 * User profiles, authentication, and bot binding management
 */

export { IdentityManager } from './identity-manager';
export { UserProfileService } from './user-profile-service';
export { BotIdentityManager } from './bot-identity-manager';
export { AuthService } from './auth-service';
export type {
  UserProfile,
  AuthCredentials,
  AuthSession,
  BotIdentity,
  BotBinding,
  OTPVerification,
  AuthProvider,
  UserRole,
  BotStatus,
  DebugLog,
} from './types';
