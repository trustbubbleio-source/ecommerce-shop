import { describe, expect, it } from 'vitest';
import { jsonRequest, makeApp, registerAndLogin, TEST_SHIPPING_ADDRESS } from '../test/helpers.js';

const checkoutBody = (overrides: Record<string, unknown> = {}) => ({
  email: 'buyer@example.com',
  items: [{ productId: 'bb-151', quantity: 1 }],
  shippingAddress: TEST_SHIPPING_ADDRESS,
  ...overrides,
});

describe('POST /api/checkout', () => {
  it('creates an order and returns a checkout URL (mock mode)', async () => {
    const { app, deps } = makeApp();
    const { res, data } = await jsonRequest(app, 'POST', '/api/checkout', checkoutBody());
    expect(res.status).toBe(201);
    expect(data.url).toContain('order_id=');
    expect(data.orderId).toMatch(/^ord_/);

    const order = await deps.orders.get(data.orderId);
    expect(order?.status).toBe('paid'); // settled synchronously in mock mode
    expect(order?.total).toBeGreaterThan(0);
    expect(order?.shippingAddress).toMatchObject({ city: 'Pallet Town' });
  });

  it('re-prices from the catalog and ignores client-sent prices', async () => {
    const { app, deps } = makeApp();
    const { data } = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      checkoutBody({
        // a malicious client could try to send price: 1 — there is no price field, by design
        items: [{ productId: 'bp-151', quantity: 2 }],
      }),
    );
    const order = (await deps.orders.get(data.orderId))!;
    expect(order.lines[0]!.unitPrice).toBe(599); // authoritative catalog price
    expect(order.subtotal).toBe(1198);
  });

  it('associates the order with an authenticated user', async () => {
    const created = makeApp();
    const token = await registerAndLogin(created);
    const { data } = await jsonRequest(
      created.app,
      'POST',
      '/api/checkout',
      checkoutBody({ email: 'trainer@pallet.town' }),
      { authorization: `Bearer ${token}` },
    );
    const order = (await created.deps.orders.get(data.orderId))!;
    expect(order.userId).toBeDefined();
  });

  it('rejects a cart with no valid items', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      checkoutBody({ items: [{ productId: 'does-not-exist', quantity: 1 }] }),
    );
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

  it('requires a shipping address', async () => {
    const { app } = makeApp();
    const { res } = await jsonRequest(app, 'POST', '/api/checkout', {
      email: 'buyer@example.com',
      items: [{ productId: 'bb-151', quantity: 1 }],
    });
    expect(res.status).toBe(400);
  });

  it('reserves stock on checkout and rejects a race after pricing still saw stock', async () => {
    const { app, deps } = makeApp();
    const product = (await deps.products.getByIdOrSlug('bb-151'))!;
    const before = product.stock;

    const first = await jsonRequest(app, 'POST', '/api/checkout', checkoutBody({ email: 'first@example.com' }));
    expect(first.res.status).toBe(201);
    expect((await deps.products.getByIdOrSlug('bb-151'))?.stock).toBe(before - 1);

    // Simulate pricing winning the race (still sees stock) while reserve loses.
    const originalGet = deps.products.getByIdOrSlug.bind(deps.products);
    deps.products.getByIdOrSlug = async (id) => {
      const found = await originalGet(id);
      return found ? { ...found, stock: 1 } : undefined;
    };
    deps.products.reserveStock = async () => ({ ok: false, productId: 'bb-151' });

    const second = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      checkoutBody({ email: 'second@example.com' }),
    );
    expect(second.res.status).toBe(409);
  });

  it('releases reserved stock when an order is cancelled', async () => {
    const { app, deps } = makeApp();
    const before = (await deps.products.getByIdOrSlug('bb-151'))!.stock;

    const checkout = await jsonRequest(app, 'POST', '/api/checkout', checkoutBody());
    expect((await deps.products.getByIdOrSlug('bb-151'))?.stock).toBe(before - 1);

    const { cancelOrderAndReleaseStock } = await import('../lib/inventory.js');
    await cancelOrderAndReleaseStock(
      deps,
      checkout.data.orderId as string,
      'Test cancel',
    );
    expect((await deps.products.getByIdOrSlug('bb-151'))?.stock).toBe(before);
  });
});
