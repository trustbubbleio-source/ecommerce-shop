import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { clearWelcomeDiscountAfterPurchase } from '../lib/welcome-discount.js';
import { notifyPaidOrder } from '../lib/order-alert.js';
import type { StripeCheckoutSessionLike } from '../lib/payments.js';

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
      const session = event.data.object as StripeCheckoutSessionLike;
      const existing = await deps.orders.getByStripeSession(session.id);
      const newlyPaid = existing?.status !== 'paid' && existing?.status !== 'fulfilled';
      const order = await deps.orders.markStatusBySession(session.id, 'paid');
      await clearWelcomeDiscountAfterPurchase(deps, order?.userId);
      if (order && !order.invoiceUrl) {
        const doc = await deps.payments.resolveInvoiceDocument(session.id, session);
        if (doc) await deps.orders.setInvoiceUrl(order.id, doc.url);
      }
      if (newlyPaid && order) await notifyPaidOrder(deps.email, deps.env, order);
    }

    return c.json({ received: true });
  });

  return app;
}
