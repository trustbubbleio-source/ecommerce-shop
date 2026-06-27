import { contactInputSchema } from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';

export function contactRoutes(_deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.post('/', validate('json', contactInputSchema), (c) => {
    const message = c.req.valid('json');
    // In production this would enqueue an email / create a ticket. We log it so
    // the submission is observable in development.
    console.info(`[contact] ${message.email} — ${message.subject}`);
    return c.json({
      ok: true,
      message: "Thanks for reaching out! We'll reply within one business day.",
    });
  });

  return app;
}
