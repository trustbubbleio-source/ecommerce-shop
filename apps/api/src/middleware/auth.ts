import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '../context.js';
import type { Env } from '../env.js';
import { verifyToken } from '../lib/jwt.js';

/** Attaches the authenticated user to the context when a valid token is present. */
export function authOptional(env: Env): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const header = c.req.header('Authorization');
    if (header?.startsWith('Bearer ')) {
      const payload = await verifyToken(header.slice(7), env.jwtSecret);
      if (payload) c.set('user', payload);
    }
    await next();
  };
}

/** Rejects the request with 401 when no authenticated user is present. */
export function requireAuth(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    if (!c.get('user')) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    await next();
  };
}
