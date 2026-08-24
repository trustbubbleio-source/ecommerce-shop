import { contactInputSchema } from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';

export function contactRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.post('/', validate('json', contactInputSchema), async (c) => {
    const message = c.req.valid('json');
    try {
      await deps.email.sendContactMessage(message);
    } catch (error) {
      console.error('[email] contact failed', error);
      return c.json({ error: 'Could not send your message. Please try again later.' }, 502);
    }
    return c.json({
      ok: true,
      message: "Thanks for reaching out! We'll reply within one business day.",
    });
  });

  return app;
}
