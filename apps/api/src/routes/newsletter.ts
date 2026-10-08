import { newsletterSubscribeInputSchema } from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';

export function newsletterRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.post('/', validate('json', newsletterSubscribeInputSchema), async (c) => {
    const { email } = c.req.valid('json');
    let created = false;
    try {
      created = await deps.newsletter.subscribe(email);
    } catch (error) {
      console.error('[newsletter] save failed', error);
      return c.json({ error: 'Could not save your signup. Please try again later.' }, 502);
    }

    if (created) {
      try {
        await deps.email.sendNewsletterConfirmation(email);
      } catch (error) {
        console.error('[email] newsletter confirmation failed', error);
        return c.json({ error: 'Could not send confirmation email. Please try again later.' }, 502);
      }
    }

    return c.json({
      ok: true,
      message: "You're on the list. Watch your inbox for drops and restocks.",
    });
  });

  return app;
}
