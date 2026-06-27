import { describe, expect, it } from 'vitest';
import { jsonRequest, makeApp, registerAndLogin } from '../test/helpers.js';

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
    const { app } = makeApp();
    const ownerToken = await registerAndLogin(app, 'owner@a.com');
    const orderId = await placeOrder(app, ownerToken);
    const otherToken = await registerAndLogin(app, 'other@a.com');
    const { res } = await jsonRequest(app, 'GET', `/api/orders/${orderId}`, undefined, {
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
    const { app } = makeApp();
    const token = await registerAndLogin(app);
    await placeOrder(app, token);
    await placeOrder(app, token);
    const { res, data } = await jsonRequest(app, 'GET', '/api/orders', undefined, {
      authorization: `Bearer ${token}`,
    });
    expect(res.status).toBe(200);
    expect(data.orders).toHaveLength(2);
  });
});
