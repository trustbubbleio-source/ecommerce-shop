import { describe, expect, it } from 'vitest';
import { makeApp, testEnv } from '../test/helpers.js';
import { PaymentService } from './payments.js';
import { reapPendingOrders } from './pending-orders.js';

describe('reapPendingOrders', () => {
  it('cancels stale unpaid pending orders and releases stock', async () => {
    const env = testEnv({ PAYPAL_API_KEY: 'test_paypal_client', PAYPAL_SECRET_KEY: 'test_secret' });
    const { deps } = makeApp({ env, payments: new PaymentService(env) });
    const product = (await deps.products.list())[0]!;
    const before = product.stock;

    const order = await deps.orders.create({
      email: 'stale@example.com',
      lines: [{ productId: product.id, name: product.name, unitPrice: product.price, quantity: 1 }],
      subtotal: product.price,
      shipping: 0,
      total: product.price,
      currency: 'sek',
    });
    await deps.products.reserveStock([{ productId: product.id, quantity: 1 }]);
    await deps.orders.attachSession(order.id, `PAYPAL_TEST_${order.id}_redirect_1`);

    // Backdate createdAt
    (order as { createdAt: string }).createdAt = new Date(Date.now() - 60 * 60_000).toISOString();

    const result = await reapPendingOrders(deps, new Date(Date.now() - 30 * 60_000));
    expect(result.cancelled).toBeGreaterThanOrEqual(1);

    const latest = await deps.orders.get(order.id);
    expect(latest?.status).toBe('cancelled');
    expect((await deps.products.getByIdOrSlug(product.id))?.stock).toBe(before);
  });

  it('settles stale orders that PayPal already captured', async () => {
    const env = testEnv({ PAYPAL_API_KEY: 'test_paypal_client', PAYPAL_SECRET_KEY: 'test_secret' });
    const payments = new PaymentService(env);
    payments.getOrder = async (id) => ({
      id,
      status: 'COMPLETED',
      purchase_units: [
        {
          payments: { captures: [{ id: 'cap1', status: 'COMPLETED' }] },
        },
      ],
    });
    const { deps } = makeApp({ env, payments });

    const order = await deps.orders.create({
      email: 'paid@example.com',
      lines: [{ productId: 'p1', name: 'Card', unitPrice: 1000, quantity: 1 }],
      subtotal: 1000,
      shipping: 0,
      total: 1000,
      currency: 'sek',
    });
    await deps.orders.attachSession(order.id, `PAYPAL_TEST_${order.id}`);
    (order as { createdAt: string }).createdAt = new Date(Date.now() - 60 * 60_000).toISOString();

    const result = await reapPendingOrders(deps, new Date(Date.now() - 30 * 60_000));
    expect(result.paid).toBeGreaterThanOrEqual(1);
    expect((await deps.orders.get(order.id))?.status).toBe('paid');
  });
});
