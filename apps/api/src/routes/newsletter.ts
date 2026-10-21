import {
  newsletterSubscribeInputSchema,
  newsletterUnsubscribeInputSchema,
} from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';
import { rateLimit } from '../middleware/rate-limit.js';

function unsubscribeUrl(deps: AppDeps, token: string): string {
  const shop = deps.env.webOrigins[0] ?? 'https://www.onemorerip.cards';
  return `${shop}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

export function newsletterRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.post(
    '/',
    rateLimit(deps.rateLimiter, 'newsletter'),
    validate('json', newsletterSubscribeInputSchema),
    async (c) => {
      const { email } = c.req.valid('json');
      let result: { created: boolean; unsubscribeToken: string };
      try {
        result = await deps.newsletter.subscribe(email);
      } catch (error) {
        console.error('[newsletter] save failed', error);
        return c.json({ error: 'Could not save your signup. Please try again later.' }, 502);
      }

      if (result.created) {
        try {
          await deps.email.sendNewsletterConfirmation(email, {
            unsubscribeUrl: unsubscribeUrl(deps, result.unsubscribeToken),
          });
        } catch (error) {
          console.error('[email] newsletter confirmation failed', error);
          return c.json(
            { error: 'Could not send confirmation email. Please try again later.' },
            502,
          );
        }
      }

      return c.json({
        ok: true,
        message: "You're on the list. Watch your inbox for drops and restocks.",
      });
    },
  );

  app.post(
    '/unsubscribe',
    rateLimit(deps.rateLimiter, 'newsletter'),
    validate('json', newsletterUnsubscribeInputSchema),
    async (c) => {
      const { token } = c.req.valid('json');
      const removed = await deps.newsletter.unsubscribe(token);
      return c.json({
        ok: true,
        removed,
        message: removed
          ? "You've been unsubscribed from drop alerts."
          : 'This unsubscribe link is invalid or already used.',
      });
    },
  );

  return app;
}
