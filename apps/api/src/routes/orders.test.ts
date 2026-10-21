import { describe, expect, it, vi } from 'vitest';
import { PaymentService } from '../lib/payments.js';
import { jsonRequest, makeApp, registerAndLogin, TEST_SHIPPING_ADDRESS, testEnv } from '../test/helpers.js';

async function placeOrder(app: ReturnType<typeof makeApp>['app'], token?: string) {
  const { data } = await jsonRequest(
    app,
    'POST',
    '/api/checkout',
    {
      email: 'buyer@example.com',
      items: [{ productId: 'bb-151', quantity: 1 }],
      shippingAddress: TEST_SHIPPING_ADDRESS,
    },
    token ? { authorization: `Bearer ${token}` } : {},
  );
  return data.orderId as string;
}

describe('POST /api/orders/:id/abandon', () => {
  it('cancels a pending order and restores reserved stock', async () => {
    const env = testEnv({
      STRIPE_SECRET_KEY: 'sk_test_real',
      STRIPE_WEBHOOK_SECRET: 'whsec_real',
    });
    const payments = new PaymentService(env, {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ id: 'cs_abandon', url: 'https://stripe.test/pay' }),
        },
      },
      coupons: { create: vi.fn().mockResolvedValue({ id: 'coup' }) },
      webhooks: { constructEvent: vi.fn() },
    });
    const created = makeApp({ env, payments });
    const before = (await created.deps.products.getByIdOrSlug('bb-151'))!.stock;

    const { data: checkout } = await jsonRequest(created.app, 'POST', '/api/checkout', {
      email: 'guest@example.com',
      items: [{ productId: 'bb-151', quantity: 1 }],
      shippingAddress: TEST_SHIPPING_ADDRESS,
    });
    const orderId = checkout.orderId as string;
    expect((await created.deps.orders.get(orderId))?.status).toBe('pending');
    expect((await created.deps.products.getByIdOrSlug('bb-151'))!.stock).toBe(before - 1);

    const { res, data } = await jsonRequest(created.app, 'POST', `/api/orders/${orderId}/abandon`);
    expect(res.status).toBe(200);
    expect(data.abandoned).toBe(true);
    expect(data.order.status).toBe('cancelled');
    expect((await created.deps.products.getByIdOrSlug('bb-151'))!.stock).toBe(before);
  });

  it('is a no-op when the order is already paid', async () => {
    const { app, deps } = makeApp();
    const orderId = await placeOrder(app);
    const { res, data } = await jsonRequest(app, 'POST', `/api/orders/${orderId}/abandon`);
    expect(res.status).toBe(200);
    expect(data.abandoned).toBe(false);
    expect((await deps.orders.get(orderId))?.status).toBe('paid');
  });
});

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

  it('requires auth to read an account-linked order', async () => {
    const created = makeApp();
    const ownerToken = await registerAndLogin(created, 'owner2@a.com');
    const orderId = await placeOrder(created.app, ownerToken);
    const { res } = await jsonRequest(created.app, 'GET', `/api/orders/${orderId}`);
    expect(res.status).toBe(401);
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

  it('hides pending (awaiting payment) orders from the account list', async () => {
    const created = makeApp();
    const email = 'pending-filter@example.com';
    const token = await registerAndLogin(created, email);
    const paidId = await placeOrder(created.app, token);
    const user = (await created.deps.users.findByEmail(email))!;
    const pending = await created.deps.orders.create({
      email,
      userId: user.id,
      lines: [{ productId: 'bb-151', name: 'Booster box', unitPrice: 1000, quantity: 1 }],
      subtotal: 1000,
      shipping: 0,
      total: 1000,
      currency: 'eur',
    });
    expect(pending.status).toBe('pending');

    const { data } = await jsonRequest(created.app, 'GET', '/api/orders', undefined, {
      authorization: `Bearer ${token}`,
    });
    const ids = (data.orders as { id: string }[]).map((o) => o.id);
    expect(ids).toContain(paidId);
    expect(ids).not.toContain(pending.id);
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
      // Welcome discount on new accounts needs a coupon when Stripe is live.
      coupons: { create: vi.fn().mockResolvedValue({ id: 'coup_welcome' }) },
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
