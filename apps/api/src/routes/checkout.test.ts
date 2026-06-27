import { describe, expect, it } from 'vitest';
import { jsonRequest, makeApp, registerAndLogin } from '../test/helpers.js';

describe('POST /api/checkout', () => {
  it('creates an order and returns a checkout URL (mock mode)', async () => {
    const { app, deps } = makeApp();
    const { res, data } = await jsonRequest(app, 'POST', '/api/checkout', {
      email: 'buyer@example.com',
      items: [{ productId: 'bb-151', quantity: 1 }],
    });
    expect(res.status).toBe(201);
    expect(data.url).toContain('order_id=');
    expect(data.orderId).toMatch(/^ord_/);

    const order = deps.orders.get(data.orderId);
    expect(order?.status).toBe('paid'); // settled synchronously in mock mode
    expect(order?.total).toBeGreaterThan(0);
  });

  it('re-prices from the catalog and ignores client-sent prices', async () => {
    const { app, deps } = makeApp();
    const { data } = await jsonRequest(app, 'POST', '/api/checkout', {
      email: 'buyer@example.com',
      // a malicious client could try to send price: 1 — there is no price field, by design
      items: [{ productId: 'bp-151', quantity: 2 }],
    });
    const order = deps.orders.get(data.orderId)!;
    expect(order.lines[0]!.unitPrice).toBe(599); // authoritative catalog price
    expect(order.subtotal).toBe(1198);
  });

  it('associates the order with an authenticated user', async () => {
    const { app, deps } = makeApp();
    const token = await registerAndLogin(app);
    const { data } = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      { email: 'trainer@pallet.town', items: [{ productId: 'bb-151', quantity: 1 }] },
      { authorization: `Bearer ${token}` },
    );
    const order = deps.orders.get(data.orderId)!;
    expect(order.userId).toBeDefined();
  });

  it('rejects a cart with no valid items', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'POST', '/api/checkout', {
      email: 'buyer@example.com',
      items: [{ productId: 'does-not-exist', quantity: 1 }],
    });
    expect(res.status).toBe(400);
  });

  it('validates the payload', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'POST', '/api/checkout', {
      email: 'not-an-email',
      items: [],
    });
    expect(res.status).toBe(400);
  });
});
