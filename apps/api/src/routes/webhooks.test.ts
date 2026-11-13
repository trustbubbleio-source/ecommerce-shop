import { describe, expect, it } from 'vitest';
import { createApp } from '../app.js';
import { loadEnv } from '../env.js';
import { PaymentService } from '../lib/payments.js';

describe('PayPal capture webhook', () => {
  it('settles a pending order after mock capture', async () => {
    const env = loadEnv({ PAYPAL_API_KEY: '', PAYPAL_SECRET_KEY: '' });
    const { app, deps } = createApp({ env, payments: new PaymentService(env) });

    const order = await deps.orders.create({
      email: 'buyer@example.com',
      lines: [{ productId: 'p1', name: 'Card', unitPrice: 1000, quantity: 1 }],
      subtotal: 1000,
      shipping: 0,
      total: 1000,
      currency: 'sek',
    });
    await deps.orders.attachSession(order.id, `PAYPAL_MOCK_${order.id}`);

    const res = await app.request('/api/webhooks/paypal/capture', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ orderId: order.id, paypalOrderId: `PAYPAL_MOCK_${order.id}` }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe('paid');

    const settled = await deps.orders.get(order.id);
    expect(settled?.status).toBe('paid');
  });

  it('returns 410 for legacy Stripe webhook path', async () => {
    const { app } = createApp();
    const res = await app.request('/api/webhooks/stripe', { method: 'POST' });
    expect(res.status).toBe(410);
  });

  it('applies absolute stock from Zettle InventoryBalanceChanged', async () => {
    const { app, deps } = createApp();
    const product = (await deps.products.list())[0]!;
    await deps.products.setStock(product.id, 9);
    // Link variant uuid in-memory
    const linked = await deps.products.update(product.id, {
      name: product.name,
      description: product.description,
      category: product.category,
      set: product.set,
      series: product.series,
      price: product.price,
      stock: 9,
      accent: product.accent,
      images: product.images.length ? product.images : ['products/x.jpg'],
      rarity: product.rarity ?? 'rare',
      condition: product.condition ?? 'near-mint',
      language: product.language,
      releaseDate: product.releaseDate,
      zettleProductUuid: '11111111-1111-1111-1111-111111111111',
      zettleVariantUuid: '22222222-2222-2222-2222-222222222222',
    });
    expect(linked?.zettleVariantUuid).toBe('22222222-2222-2222-2222-222222222222');

    const res = await app.request('/api/webhooks/zettle', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        eventName: 'InventoryBalanceChanged',
        payload: {
          balanceAfter: [
            {
              variantUuid: '22222222-2222-2222-2222-222222222222',
              balance: '4',
            },
          ],
        },
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.updated).toBe(1);
    expect((await deps.products.getByIdOrSlug(product.id))?.stock).toBe(4);
  });
});
