import { loginInputSchema, registerInputSchema } from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';
import { signToken } from '../lib/jwt.js';
import { hashPassword, verifyPassword } from '../lib/password.js';
import { requireAuth } from '../middleware/auth.js';
import { toPublicUser } from '../repositories/users.js';

export function authRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.post('/register', validate('json', registerInputSchema), async (c) => {
    const { name, email, password } = c.req.valid('json');
    if (await deps.users.findByEmail(email)) {
      return c.json({ error: 'An account with this email already exists' }, 409);
    }
    const passwordHash = await hashPassword(password);
    const user = await deps.users.create({ name, email, passwordHash });
    const token = await signToken({ sub: user.id, email: user.email }, deps.env.jwtSecret);
    return c.json({ token, user: toPublicUser(user) }, 201);
  });

  app.post('/login', validate('json', loginInputSchema), async (c) => {
    const { email, password } = c.req.valid('json');
    const user = await deps.users.findByEmail(email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }
    const token = await signToken({ sub: user.id, email: user.email }, deps.env.jwtSecret);
    return c.json({ token, user: toPublicUser(user) });
  });

  app.get('/me', requireAuth(), async (c) => {
    const payload = c.get('user')!;
    const user = await deps.users.findByEmail(payload.email);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({ user: toPublicUser(user) });
  });

  return app;
}
