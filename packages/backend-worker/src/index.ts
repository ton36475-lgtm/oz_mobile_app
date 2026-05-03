/**
 * OZ System - Cloudflare Workers Backend
 * Main entry point for serverless backend
 */

import { Router } from 'itty-router';
import { json, text } from 'itty-router-extras';

// Import route handlers
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { terminalRoutes } from './routes/terminals';
import { agentRoutes } from './routes/agents';
import { debateRoutes } from './routes/debates';
import { identityRoutes } from './routes/identity';
import { llmRoutes } from './routes/llm';
import { toolRoutes } from './routes/tools';
import { auditRoutes } from './routes/audit';

// Import middleware
import { authenticate } from './middleware/auth';
import { errorHandler } from './middleware/error-handler';
import { logger } from './middleware/logger';
import { cors } from './middleware/cors';

// Create router
const router = Router();

// Global middleware
router.all('*', cors);
router.all('*', logger);

// Health check
router.get('/health', () => json({ status: 'ok', timestamp: new Date().toISOString() }));

// API version
router.get('/api/version', () => json({ version: '1.0.0', env: process.env.ENVIRONMENT }));

// Auth routes (no authentication required)
router.post('/api/auth/login', authRoutes.login);
router.post('/api/auth/register', authRoutes.register);
router.post('/api/auth/oauth/github', authRoutes.githubOAuth);
router.post('/api/auth/oauth/google', authRoutes.googleOAuth);
router.post('/api/auth/oauth/sso', authRoutes.ssoOAuth);
router.post('/api/auth/logout', authenticate, authRoutes.logout);
router.post('/api/auth/refresh', authRoutes.refreshToken);
router.post('/api/auth/verify-otp', authRoutes.verifyOTP);

// User routes (authenticated)
router.get('/api/users/me', authenticate, userRoutes.getProfile);
router.put('/api/users/me', authenticate, userRoutes.updateProfile);
router.get('/api/users/me/settings', authenticate, userRoutes.getSettings);
router.put('/api/users/me/settings', authenticate, userRoutes.updateSettings);

// Terminal routes (authenticated)
router.get('/api/terminals', authenticate, terminalRoutes.list);
router.post('/api/terminals', authenticate, terminalRoutes.create);
router.get('/api/terminals/:id', authenticate, terminalRoutes.get);
router.put('/api/terminals/:id', authenticate, terminalRoutes.update);
router.delete('/api/terminals/:id', authenticate, terminalRoutes.delete);
router.post('/api/terminals/:id/connect', authenticate, terminalRoutes.connect);
router.post('/api/terminals/:id/disconnect', authenticate, terminalRoutes.disconnect);
router.post('/api/terminals/:id/execute', authenticate, terminalRoutes.execute);

// Agent routes (authenticated)
router.get('/api/agents', authenticate, agentRoutes.list);
router.post('/api/agents', authenticate, agentRoutes.create);
router.get('/api/agents/:id', authenticate, agentRoutes.get);
router.put('/api/agents/:id', authenticate, agentRoutes.update);
router.delete('/api/agents/:id', authenticate, agentRoutes.delete);
router.get('/api/agents/:id/status', authenticate, agentRoutes.getStatus);

// Debate routes (authenticated)
router.get('/api/debates', authenticate, debateRoutes.list);
router.post('/api/debates', authenticate, debateRoutes.create);
router.get('/api/debates/:id', authenticate, debateRoutes.get);
router.post('/api/debates/:id/start', authenticate, debateRoutes.start);
router.post('/api/debates/:id/next-round', authenticate, debateRoutes.nextRound);
router.post('/api/debates/:id/end', authenticate, debateRoutes.end);
router.get('/api/debates/:id/messages', authenticate, debateRoutes.getMessages);

// Identity routes (authenticated)
router.get('/api/identity/bots', authenticate, identityRoutes.listBots);
router.post('/api/identity/bots', authenticate, identityRoutes.createBot);
router.get('/api/identity/bots/:id', authenticate, identityRoutes.getBot);
router.put('/api/identity/bots/:id', authenticate, identityRoutes.updateBot);
router.delete('/api/identity/bots/:id', authenticate, identityRoutes.deleteBot);
router.post('/api/identity/bots/:id/verify', authenticate, identityRoutes.verifyBot);
router.post('/api/identity/bots/:id/reset-binding', authenticate, identityRoutes.resetBinding);

// LLM routes (authenticated)
router.get('/api/llm/models', authenticate, llmRoutes.listModels);
router.post('/api/llm/prompt', authenticate, llmRoutes.prompt);
router.get('/api/llm/usage', authenticate, llmRoutes.getUsage);
router.get('/api/llm/history', authenticate, llmRoutes.getHistory);

// Tool routes (authenticated)
router.get('/api/tools', authenticate, toolRoutes.list);
router.post('/api/tools/execute', authenticate, toolRoutes.execute);
router.get('/api/tools/:id/history', authenticate, toolRoutes.getHistory);
router.get('/api/tools/stats', authenticate, toolRoutes.getStats);

// Audit routes (authenticated)
router.get('/api/audit/logs', authenticate, auditRoutes.getLogs);
router.get('/api/audit/logs/:id', authenticate, auditRoutes.getLog);

// 404 handler
router.all('*', () => json({ error: 'Not found' }, { status: 404 }));

// Error handler
router.all('*', errorHandler);

// Export handler
export default {
  fetch: (request: Request, env: any, ctx: any) => {
    return router.handle(request, env, ctx).catch(errorHandler);
  },
  scheduled: async (event: any, env: any, ctx: any) => {
    // Handle scheduled events (cron jobs)
    console.log('Scheduled event triggered:', event.cron);
    
    // Example: Clean up expired sessions
    if (event.cron === '0 0 * * *') {
      // Clean up logic here
      console.log('Running cleanup job');
    }
  }
};
