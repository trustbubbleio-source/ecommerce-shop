import { checkoutInputSchema, priceCartAsync } from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';
import { stockLinesFromOrder } from '../lib/inventory.js';
import { notifyPaidOrder } from '../lib/order-alert.js';
import { canPurchase } from '../lib/prelaunch.js';
import {
  clearWelcomeDiscountAfterPurchase,
  userHasCompletedOrder,
} from '../lib/welcome-discount.js';
import { rateLimit } from '../middleware/rate-limit.js';

export function checkoutRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.post('/', rateLimit(deps.rateLimiter, 'checkout'), validate('json', checkoutInputSchema), async (c) => {
    const input = c.req.valid('json');
    const auth = c.get('user');
    const savedUser = auth ? await deps.users.findById(auth.sub) : undefined;
    const hasCompletedOrder = auth ? await userHasCompletedOrder(deps, auth.sub) : false;
    const discountCode = savedUser?.profile.discountCode ?? null;

    if (!canPurchase(savedUser?.role)) {
      return c.json({ error: 'Purchases open October 31, 2026.' }, 403);
    }

    const priced = await priceCartAsync(
      input.items,
      (id) => deps.products.getByIdOrSlug(id),
      input.currency ?? 'sek',
      discountCode,
      hasCompletedOrder,
    );

    if (priced.lines.length === 0) {
      return c.json({ error: 'None of the items in your cart are currently available' }, 400);
    }

    const reserved = await deps.products.reserveStock(stockLinesFromOrder({ lines: priced.lines }));
    if (!reserved.ok) {
      return c.json(
        { error: 'One or more items just sold out. Please refresh your cart and try again.' },
        409,
      );
    }

    let orderId: string | undefined;
    try {
      const order = await deps.orders.create({
        email: input.email,
        userId: auth?.sub,
        lines: priced.lines,
        subtotal: priced.subtotal,
        shipping: priced.shipping,
        total: priced.total,
        currency: priced.currency,
        shippingAddress: input.shippingAddress,
      });
      orderId = order.id;

      const checkout = await deps.payments.createCheckout(order);
      await deps.orders.attachSession(order.id, checkout.sessionId);

      // In mock mode there is no Stripe webhook, so settle the order immediately
      // to make the end-to-end purchase flow demoable without credentials.
      // Stock stays reserved (= sold).
      if (!deps.payments.enabled) {
        const paid = await deps.orders.setStatus(order.id, 'paid');
        await clearWelcomeDiscountAfterPurchase(deps, auth?.sub);
        if (paid) await notifyPaidOrder(deps.email, deps.env, paid);
      }

      return c.json({ url: checkout.url, orderId: order.id }, 201);
    } catch (error) {
      await deps.products.releaseStock(stockLinesFromOrder({ lines: priced.lines }));
      if (orderId) {
        await deps.orders.cancel(orderId, 'Checkout failed before payment session was created.');
      }
      throw error;
    }
  });

  return app;
}
