/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user context
 */

import { verify } from '@tsndr/cloudflare-worker-jwt';

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export const authenticate = async (request: Request, env: any) => {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const token = authHeader.substring(7);

  try {
    // Verify JWT token
    const payload = await verify(token, env.JWT_SECRET || 'your-secret-key');
    
    // Attach auth context to request
    (request as any).auth = {
      userId: payload.sub,
      email: payload.email,
      role: payload.role || 'user',
      permissions: payload.permissions || []
    };

    return null; // Continue to next middleware
  } catch (error) {
    console.error('Token verification failed:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const authorize = (requiredRoles: string[]) => {
  return async (request: Request) => {
    const auth = (request as any).auth;
    
    if (!auth) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!requiredRoles.includes(auth.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return null; // Continue
  };
};
