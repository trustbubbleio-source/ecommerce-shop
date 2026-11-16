import {
  capturePaymentInputSchema,
  checkoutInputSchema,
  paymentSessionInputSchema,
  priceCartAsync,
  storePickupAddress,
  type CheckoutConfig,
  type DeliveryMethod,
  type PaymentMethod,
} from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';
import {
  releaseStockSynced,
  reserveStockSynced,
  stockLinesFromOrder,
} from '../lib/inventory.js';
import { notifyPaidOrder } from '../lib/order-alert.js';
import { canPurchase } from '../lib/prelaunch.js';
import { captureAndSettle } from '../lib/settle-payment.js';
import {
  clearWelcomeDiscountAfterPurchase,
  userHasCompletedOrder,
} from '../lib/welcome-discount.js';
import { rateLimit } from '../middleware/rate-limit.js';
import { canAccessOrder } from './orders.js';

function accessDenied(c: { json: (body: unknown, status: 401 | 403) => Response }, access: 401 | 403) {
  return c.json(
    { error: access === 401 ? 'Authentication required' : 'You do not have access to this order' },
    access,
  );
}

function buildCheckoutConfig(deps: AppDeps, isAdmin: boolean): CheckoutConfig {
  if (!deps.payments.enabled) {
    return {
      provider: 'mock',
      environment: deps.env.paypalMode,
      clientId: '',
      currency: 'SEK',
      locale: 'sv-SE',
      methods: { cardFields: false, paypalButton: false, redirect: true },
    };
  }

  const flag = deps.env.paypalCardFields;
  const cardFields = flag === 'on' || (flag === 'admin' && isAdmin);

  return {
    provider: 'paypal',
    environment: deps.env.paypalMode,
    clientId: deps.env.paypalClientId,
    currency: 'SEK',
    locale: 'sv-SE',
    methods: {
      cardFields,
      paypalButton: cardFields,
      redirect: true,
    },
  };
}

function checkoutResponse(
  orderId: string,
  checkout: { sessionId: string; url: string | null },
  method: PaymentMethod,
  paid: boolean,
) {
  if (paid) {
    return {
      orderId,
      url: checkout.url,
      paypalOrderId: checkout.sessionId,
      status: 'paid' as const,
    };
  }
  if (method === 'redirect') {
    return {
      orderId,
      url: checkout.url,
      paypalOrderId: checkout.sessionId,
      status: 'pending' as const,
    };
  }
  return {
    orderId,
    url: null,
    paypalOrderId: checkout.sessionId,
    status: 'pending' as const,
  };
}

export function checkoutRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.get('/config', async (c) => {
    const auth = c.get('user');
    let isAdmin = false;
    if (auth) {
      const user = await deps.users.findById(auth.sub);
      isAdmin = user?.role === 'admin';
    }
    return c.json(buildCheckoutConfig(deps, isAdmin));
  });

  app.post('/', rateLimit(deps.rateLimiter, 'checkout'), validate('json', checkoutInputSchema), async (c) => {
    const input = c.req.valid('json');
    const method: PaymentMethod = input.paymentMethod ?? 'redirect';
    const auth = c.get('user');
    const savedUser = auth ? await deps.users.findById(auth.sub) : undefined;
    const hasCompletedOrder = auth ? await userHasCompletedOrder(deps, auth.sub) : false;
    const discountCode = savedUser?.profile.discountCode ?? null;

    if (!canPurchase(savedUser?.role)) {
      return c.json({ error: 'Purchases are temporarily unavailable.' }, 403);
    }

    const deliveryMethod: DeliveryMethod = input.deliveryMethod ?? 'shipping';
    const shippingAddress =
      deliveryMethod === 'pickup'
        ? storePickupAddress(input.shippingAddress.fullName)
        : input.shippingAddress;

    const priced = await priceCartAsync(
      input.items,
      (id) => deps.products.getByIdOrSlug(id),
      input.currency ?? 'sek',
      discountCode,
      {
        hasCompletedOrder,
        userEmail: savedUser?.email,
        userId: auth?.sub,
        deliveryMethod,
        resolveDiscount: (code) => deps.discounts.findActiveDef(code),
      },
    );

    if (priced.lines.length === 0) {
      return c.json({ error: 'None of the items in your cart are currently available' }, 400);
    }

    const stockLines = stockLinesFromOrder({ lines: priced.lines });
    const reserved = await reserveStockSynced(deps, stockLines);
    if (!reserved.ok) {
      return c.json(
        {
          error: reserved.error
            ? `Could not reserve stock in Zettle: ${reserved.error}`
            : 'One or more items just sold out. Please refresh your cart and try again.',
        },
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
        deliveryMethod,
        shippingAddress,
      });
      orderId = order.id;

      const checkout = await deps.payments.createCheckout(order, { method });
      await deps.orders.attachSession(order.id, checkout.sessionId);

      let paid = false;
      // In mock mode there is no PayPal capture, so settle immediately.
      if (!deps.payments.enabled) {
        const settled = await deps.orders.setStatus(order.id, 'paid');
        await clearWelcomeDiscountAfterPurchase(deps, auth?.sub);
        if (settled) await notifyPaidOrder(deps.email, deps.env, settled);
        paid = true;
      }

      return c.json(checkoutResponse(order.id, checkout, method, paid), 201);
    } catch (error) {
      await releaseStockSynced(deps, stockLines);
      if (orderId) {
        await deps.orders.cancel(orderId, 'Checkout failed before payment session was created.');
      }
      const message = error instanceof Error ? error.message : 'Checkout failed';
      console.error('[checkout] payment session failed', error);
      return c.json({ error: message }, 502);
    }
  });

  app.post(
    '/:orderId/payment-session',
    rateLimit(deps.rateLimiter, 'checkout'),
    validate('json', paymentSessionInputSchema),
    async (c) => {
      const orderId = c.req.param('orderId');
      const { paymentMethod: method } = c.req.valid('json');
      const order = await deps.orders.get(orderId);
      if (!order) return c.json({ error: 'Order not found' }, 404);

      const access = canAccessOrder(order, c.get('user')?.sub);
      if (access !== 'ok') return accessDenied(c, access);

      if (order.status === 'paid' || order.status === 'fulfilled') {
        return c.json({
          orderId: order.id,
          paypalOrderId: order.paymentSessionId,
          status: 'paid' as const,
          url: null,
        });
      }

      if (order.status !== 'pending') {
        return c.json({ error: 'Order is not awaiting payment', code: 'ORDER_NOT_PENDING' }, 409);
      }

      // If a previous PayPal order was already captured, settle instead of creating another.
      if (order.paymentSessionId && deps.payments.enabled) {
        try {
          const existing = await deps.payments.getOrder(order.paymentSessionId);
          const captureStatus =
            existing.purchase_units?.[0]?.payments?.captures?.[0]?.status?.toUpperCase();
          if (captureStatus === 'COMPLETED' || existing.status === 'COMPLETED') {
            const settled = await captureAndSettle(deps, order, order.paymentSessionId, {
              skip3ds: true,
            });
            if (settled.kind === 'paid') {
              return c.json({
                orderId: order.id,
                paypalOrderId: order.paymentSessionId,
                status: 'paid' as const,
                url: null,
              });
            }
          }
        } catch (error) {
          console.warn('[checkout] previous PayPal order lookup failed; creating new session', error);
        }
      }

      try {
        const checkout = await deps.payments.createCheckout(order, { method });
        await deps.orders.attachSession(order.id, checkout.sessionId);
        return c.json(checkoutResponse(order.id, checkout, method, false));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Could not create payment session';
        console.error('[checkout] payment-session failed', error);
        return c.json({ error: message }, 502);
      }
    },
  );

  app.post(
    '/:orderId/capture',
    rateLimit(deps.rateLimiter, 'checkout'),
    validate('json', capturePaymentInputSchema),
    async (c) => {
      const orderId = c.req.param('orderId');
      const { paypalOrderId } = c.req.valid('json');
      const order = await deps.orders.get(orderId);
      if (!order) return c.json({ error: 'Order not found' }, 404);

      const access = canAccessOrder(order, c.get('user')?.sub);
      if (access !== 'ok') return accessDenied(c, access);

      const result = await captureAndSettle(deps, order, paypalOrderId);

      if (result.kind === 'paid') {
        return c.json({ ok: true, status: 'paid' as const });
      }
      if (result.kind === 'pending') {
        return c.json({ status: 'pending' as const, code: 'PENDING_REVIEW' }, 202);
      }
      if (result.kind === 'declined') {
        return c.json(
          { error: 'Your card was declined', code: 'PAYMENT_DECLINED', retryable: true },
          402,
        );
      }
      if (result.kind === 'sca_failed') {
        return c.json({ error: result.reason, code: 'SCA_FAILED', retryable: true }, 402);
      }
      if (result.kind === 'mismatch') {
        return c.json({ error: result.message, code: 'ORDER_MISMATCH' }, 409);
      }
      return c.json({ error: result.message }, result.status as 404 | 409 | 502);
    },
  );

  return app;
}
