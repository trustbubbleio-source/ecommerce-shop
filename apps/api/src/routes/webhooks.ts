import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';

export function webhookRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.post('/stripe', async (c) => {
    if (!deps.payments.enabled) {
      // No Stripe configured — orders settle synchronously in mock mode.
      return c.json({ received: true, mock: true });
    }

    const signature = c.req.header('stripe-signature');
    if (!signature) {
      return c.json({ error: 'Missing stripe-signature header' }, 400);
    }

    const payload = await c.req.text();
    let event: { type: string; data: { object: unknown } };
    try {
      event = deps.payments.constructEvent(payload, signature);
    } catch {
      return c.json({ error: 'Invalid signature' }, 400);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { id: string };
      await deps.orders.markStatusBySession(session.id, 'paid');
    }

    return c.json({ received: true });
  });

  return app;
}
