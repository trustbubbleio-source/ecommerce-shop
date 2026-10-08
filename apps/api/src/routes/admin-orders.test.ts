import { describe, expect, it, vi } from 'vitest';
import { hashPassword } from '../lib/password.js';
import { PaymentService, type StripeLike } from '../lib/payments.js';
import { jsonRequest, makeApp, testEnv } from '../test/helpers.js';

const adminCreds = { name: 'Admin', email: 'admin@test.local', password: 'adminpass123' };

async function seedAdmin(deps: Awaited<ReturnType<typeof makeApp>>['deps']) {
  const passwordHash = await hashPassword(adminCreds.password);
  return deps.users.create({
    ...adminCreds,
    passwordHash,
    role: 'admin',
    emailVerifiedAt: new Date().toISOString(),
  });
}

async function loginAdmin(app: ReturnType<typeof makeApp>['app']) {
  const { data } = await jsonRequest(app, 'POST', '/api/auth/login', {
    email: adminCreds.email,
    password: adminCreds.password,
  });
  return data.token as string;
}

describe('GET /api/admin/orders', () => {
  it('lists paid orders for an admin', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { app, deps } = makeApp();
    await seedAdmin(deps);
    const token = await loginAdmin(app);

    const checkout = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      { email: 'buyer@example.com', items: [{ productId: 'bb-151', quantity: 1 }] },
      { authorization: `Bearer ${token}` },
    );
    expect(checkout.res.status).toBe(201);

    const { res, data } = await jsonRequest(app, 'GET', '/api/admin/orders', undefined, {
      authorization: `Bearer ${token}`,
    });
    expect(res.status).toBe(200);
    expect(data.orders).toHaveLength(1);
    expect(data.orders[0].status).toBe('paid');
    expect(data.orders[0].fulfillmentStep).toBe('packing');
    info.mockRestore();
  });

  it('advances fulfillment and stores carrier details', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { app, deps } = makeApp();
    await seedAdmin(deps);
    const token = await loginAdmin(app);
    const checkout = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      { email: 'buyer@example.com', items: [{ productId: 'bb-151', quantity: 1 }] },
      { authorization: `Bearer ${token}` },
    );
    const orderId = checkout.data.orderId as string;

    const { res, data } = await jsonRequest(
      app,
      'PATCH',
      `/api/admin/orders/${orderId}`,
      {
        fulfillmentStep: 'handed_to_carrier',
        carrierName: 'PostNord',
        trackingUrl: 'https://tracking.postnord.com/abc',
      },
      { authorization: `Bearer ${token}` },
    );
    expect(res.status).toBe(200);
    expect(data.order.fulfillmentStep).toBe('handed_to_carrier');
    expect(data.order.status).toBe('paid');
    expect(data.order.carrierName).toBe('PostNord');
    expect(data.order.trackingUrl).toBe('https://tracking.postnord.com/abc');

    const delivered = await jsonRequest(
      app,
      'PATCH',
      `/api/admin/orders/${orderId}`,
      { fulfillmentStep: 'delivered' },
      { authorization: `Bearer ${token}` },
    );
    expect(delivered.data.order.status).toBe('fulfilled');
    info.mockRestore();
  });

  it('cancels an unpaid order with a reason and rejects a second cancel', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { app, deps } = makeApp();
    await seedAdmin(deps);
    const token = await loginAdmin(app);
    const order = await deps.orders.create({
      email: 'buyer@example.com',
      lines: [{ productId: 'bb-151', name: 'Booster box', unitPrice: 1000, quantity: 1 }],
      subtotal: 1000,
      shipping: 0,
      total: 1000,
      currency: 'eur',
    });

    const { res, data } = await jsonRequest(
      app,
      'POST',
      `/api/admin/orders/${order.id}/cancel`,
      { reason: 'This card is no longer in stock.' },
      { authorization: `Bearer ${token}` },
    );
    expect(res.status).toBe(200);
    expect(data.order.status).toBe('cancelled');
    expect(data.order.cancelReason).toBe('This card is no longer in stock.');
    expect(data.order.fulfillmentStep).toBeUndefined();

    const again = await jsonRequest(
      app,
      'POST',
      `/api/admin/orders/${order.id}/cancel`,
      { reason: 'Trying again.' },
      { authorization: `Bearer ${token}` },
    );
    expect(again.res.status).toBe(409);
    info.mockRestore();
  });

  it('cancels a paid order that was settled without Stripe', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { app, deps } = makeApp();
    await seedAdmin(deps);
    const token = await loginAdmin(app);
    const checkout = await jsonRequest(app, 'POST', '/api/checkout', {
      email: 'buyer@example.com',
      items: [{ productId: 'bb-151', quantity: 1 }],
    });
    const orderId = checkout.data.orderId as string;

    const { res, data } = await jsonRequest(
      app,
      'POST',
      `/api/admin/orders/${orderId}/cancel`,
      { reason: 'We do not have this card.' },
      { authorization: `Bearer ${token}` },
    );
    expect(res.status).toBe(200);
    expect(data.order.status).toBe('cancelled');
    expect(data.order.cancelReason).toBe('We do not have this card.');
    info.mockRestore();
  });

  it('refuses to cancel a delivered order', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const { app, deps } = makeApp();
    await seedAdmin(deps);
    const token = await loginAdmin(app);
    const checkout = await jsonRequest(app, 'POST', '/api/checkout', {
      email: 'buyer@example.com',
      items: [{ productId: 'bb-151', quantity: 1 }],
    });
    const orderId = checkout.data.orderId as string;
    await jsonRequest(
      app,
      'PATCH',
      `/api/admin/orders/${orderId}`,
      { fulfillmentStep: 'delivered' },
      { authorization: `Bearer ${token}` },
    );

    const { res } = await jsonRequest(
      app,
      'POST',
      `/api/admin/orders/${orderId}/cancel`,
      { reason: 'Changed our mind.' },
      { authorization: `Bearer ${token}` },
    );
    expect(res.status).toBe(409);
    info.mockRestore();
  });

  it('refunds the Stripe payment when cancelling a paid order', async () => {
    const info = vi.spyOn(console, 'info').mockImplementation(() => {});
    const refund = vi.fn().mockResolvedValue({ id: 're_1' });
    const env = testEnv({ STRIPE_SECRET_KEY: 'sk_test_real', STRIPE_WEBHOOK_SECRET: 'whsec_real' });
    const payments = new PaymentService(env, {
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ id: 'cs_live_cancel', url: 'https://stripe.test/pay' }),
          retrieve: vi.fn().mockResolvedValue({ id: 'cs_live_cancel', payment_intent: 'pi_1' }),
        },
      },
      webhooks: { constructEvent: vi.fn() },
      refunds: { create: refund },
    } satisfies StripeLike);
    const { app, deps } = makeApp({ env, payments });
    await seedAdmin(deps);
    const token = await loginAdmin(app);
    const checkout = await jsonRequest(app, 'POST', '/api/checkout', {
      email: 'buyer@example.com',
      items: [{ productId: 'bb-151', quantity: 1 }],
    });
    const orderId = checkout.data.orderId as string;
    await deps.orders.setStatus(orderId, 'paid');

    const { res, data } = await jsonRequest(
      app,
      'POST',
      `/api/admin/orders/${orderId}/cancel`,
      { reason: 'This card is no longer in stock.' },
      { authorization: `Bearer ${token}` },
    );
    expect(res.status).toBe(200);
    expect(data.order.status).toBe('cancelled');
    expect(refund).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent: 'pi_1',
        metadata: { orderId, adminCancel: 'true' },
      }),
    );
    info.mockRestore();
  });
});
