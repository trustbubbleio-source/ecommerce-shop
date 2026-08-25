import { checkoutInputSchema, priceCartAsync } from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';
import {
  clearWelcomeDiscountAfterPurchase,
  userHasCompletedOrder,
} from '../lib/welcome-discount.js';

export function checkoutRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.post('/', validate('json', checkoutInputSchema), async (c) => {
    const input = c.req.valid('json');
    const auth = c.get('user');
    const savedUser = auth ? await deps.users.findById(auth.sub) : undefined;
    const hasCompletedOrder = auth ? await userHasCompletedOrder(deps, auth.sub) : false;
    const discountCode = savedUser?.profile.discountCode ?? null;

    const priced = await priceCartAsync(
      input.items,
      (id) => deps.products.getByIdOrSlug(id),
      input.currency ?? 'eur',
      discountCode,
      hasCompletedOrder,
    );

    if (priced.lines.length === 0) {
      return c.json({ error: 'None of the items in your cart are currently available' }, 400);
    }

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

    const checkout = await deps.payments.createCheckout(order);
    await deps.orders.attachSession(order.id, checkout.sessionId);

    // In mock mode there is no Stripe webhook, so settle the order immediately
    // to make the end-to-end purchase flow demoable without credentials.
    if (!deps.payments.enabled) {
      await deps.orders.setStatus(order.id, 'paid');
      await clearWelcomeDiscountAfterPurchase(deps, auth?.sub);
    }

    return c.json({ url: checkout.url, orderId: order.id }, 201);
  });

  return app;
}
