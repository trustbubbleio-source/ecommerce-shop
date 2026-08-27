import { describe, expect, it, vi } from 'vitest';
import { hashPassword } from '../lib/password.js';
import { jsonRequest, makeApp } from '../test/helpers.js';

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
});
