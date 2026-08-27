import { describe, expect, it, vi } from 'vitest';
import { PaymentService } from '../lib/payments.js';
import { jsonRequest, makeApp, registerAndLogin, testEnv } from '../test/helpers.js';

async function placeOrder(app: ReturnType<typeof makeApp>['app'], token?: string) {
  const { data } = await jsonRequest(
    app,
    'POST',
    '/api/checkout',
    { email: 'buyer@example.com', items: [{ productId: 'bb-151', quantity: 1 }] },
    token ? { authorization: `Bearer ${token}` } : {},
  );
  return data.orderId as string;
}

describe('GET /api/orders/:id', () => {
  it('returns a guest order by its capability id', async () => {
    const { app } = makeApp();
    const orderId = await placeOrder(app);
    const { res, data } = await jsonRequest(app, 'GET', `/api/orders/${orderId}`);
    expect(res.status).toBe(200);
    expect(data.order.id).toBe(orderId);
  });

  it('returns 404 for an unknown order', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'GET', '/api/orders/ord_missing');
    expect(res.status).toBe(404);
  });

  it('forbids another user from reading an owned order', async () => {
    const created = makeApp();
    const ownerToken = await registerAndLogin(created, 'owner@a.com');
    const orderId = await placeOrder(created.app, ownerToken);
    const otherToken = await registerAndLogin(created, 'other@a.com');
    const { res } = await jsonRequest(created.app, 'GET', `/api/orders/${orderId}`, undefined, {
      authorization: `Bearer ${otherToken}`,
    });
    expect(res.status).toBe(403);
  });
});

describe('GET /api/orders', () => {
  it('requires authentication', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'GET', '/api/orders');
    expect(res.status).toBe(401);
  });

  it('lists the orders for the authenticated user', async () => {
    const created = makeApp();
    const token = await registerAndLogin(created);
    await placeOrder(created.app, token);
    await placeOrder(created.app, token);
    const { res, data } = await jsonRequest(created.app, 'GET', '/api/orders', undefined, {
      authorization: `Bearer ${token}`,
    });
    expect(res.status).toBe(200);
    expect(data.orders).toHaveLength(2);
  });

  it('hydrates a Stripe invoice URL onto paid orders', async () => {
    const sessionId = 'cs_live_hydrate';
    const env = testEnv({
      STRIPE_SECRET_KEY: 'sk_test_real',
      STRIPE_WEBHOOK_SECRET: 'whsec_real',
    });
    const payments = new PaymentService(env, {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ id: sessionId, url: 'https://stripe.test/pay' }),
          retrieve: vi.fn().mockResolvedValue({
            id: sessionId,
            invoice: { invoice_pdf: 'https://pay.stripe.com/invoice/inv_h/pdf' },
          }),
        },
      },
      webhooks: { constructEvent: vi.fn() },
    });
    const created = makeApp({ env, payments });
    const token = await registerAndLogin(created);
    const orderId = await placeOrder(created.app, token);
    await created.deps.orders.setStatus(orderId, 'paid');

    const { data } = await jsonRequest(created.app, 'GET', '/api/orders', undefined, {
      authorization: `Bearer ${token}`,
    });
    expect(data.orders[0]?.invoiceUrl).toBe('https://pay.stripe.com/invoice/inv_h/pdf');
  });
});
