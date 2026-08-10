import type { MiddlewareHandler } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';

/** Rejects non-admin users. Must run after requireAuth. */
export function requireAdmin(deps: AppDeps): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const payload = c.get('user');
    if (!payload) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    const user = await deps.users.findByEmail(payload.email);
    if (!user || user.role !== 'admin') {
      return c.json({ error: 'Admin access required' }, 403);
    }
    await next();
  };
}
