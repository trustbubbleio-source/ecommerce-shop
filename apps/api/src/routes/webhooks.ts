import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { cancelOrderAndReleaseStock } from '../lib/inventory.js';
import { clearWelcomeDiscountAfterPurchase } from '../lib/welcome-discount.js';
import { notifyPaidOrder, notifyRefundedOrder } from '../lib/order-alert.js';
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
      // Atomic pending→paid so concurrent webhook deliveries only email once.
      const newlyPaid = await deps.orders.markPaidBySession(session.id);
      if (newlyPaid) {
        await clearWelcomeDiscountAfterPurchase(deps, newlyPaid.userId);
        if (!newlyPaid.invoiceUrl) {
          const doc = await deps.payments.resolveInvoiceDocument(session.id, session);
          if (doc) await deps.orders.setInvoiceUrl(newlyPaid.id, doc.url);
        }
        await notifyPaidOrder(deps.email, deps.env, newlyPaid);
      } else {
        const existing = await deps.orders.getByStripeSession(session.id);
        if (existing && !existing.invoiceUrl) {
          const doc = await deps.payments.resolveInvoiceDocument(session.id, session);
          if (doc) await deps.orders.setInvoiceUrl(existing.id, doc.url);
        }
      }
    }

    // Abandoned / expired Checkout — free reserved stock.
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as StripeCheckoutSessionLike;
      const existing = await deps.orders.getByStripeSession(session.id);
      if (existing?.status === 'pending') {
        await cancelOrderAndReleaseStock(
          deps,
          existing.id,
          'Stripe Checkout session expired before payment.',
        );
      }
    }

    if (event.type === 'charge.refunded') {
      const charge = event.data.object as {
        metadata?: { orderId?: string };
        refunded?: boolean;
        refunds?: { data?: Array<{ metadata?: { adminCancel?: string } }> };
      };
      const orderId = charge.metadata?.orderId;
      const adminCancel = charge.refunds?.data?.some(
        (refund) => refund.metadata?.adminCancel === 'true',
      );
      if (orderId && charge.refunded === true) {
        const existing = await deps.orders.get(orderId);
        if (existing && existing.status !== 'cancelled' && !existing.cancelReason) {
          const result = await cancelOrderAndReleaseStock(
            deps,
            orderId,
            'Refunded via Stripe.',
          );
          if (result?.order && !adminCancel) {
            await notifyRefundedOrder(deps.email, deps.env, result.order);
          }
        }
      }
    }

    return c.json({ received: true });
  });

  return app;
}
