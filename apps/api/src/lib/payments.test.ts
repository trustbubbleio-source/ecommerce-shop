import { describe, expect, it } from 'vitest';
import { loadEnv } from '../env.js';
import { orderDiscountCents, PaymentService } from './payments.js';
import type { Order } from '@akknerds/shared';

function mockOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ord_test',
    email: 'buyer@example.com',
    lines: [{ productId: 'p1', name: 'Test Card', unitPrice: 10000, quantity: 1 }],
    subtotal: 10000,
    shipping: 6900,
    total: 16900,
    currency: 'sek',
    status: 'pending',
    channel: 'online',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('orderDiscountCents', () => {
  it('returns the gap between merchandise+shipping and total', () => {
    expect(orderDiscountCents(mockOrder({ subtotal: 10000, shipping: 6900, total: 14900 }))).toBe(
      2000,
    );
  });
});

describe('PaymentService (mock mode)', () => {
  const env = loadEnv({ PAYPAL_API_KEY: '', PAYPAL_SECRET_KEY: '' });

  it('is disabled without credentials', () => {
    expect(new PaymentService(env).enabled).toBe(false);
  });

  it('returns a local success URL in mock mode', async () => {
    const service = new PaymentService(env);
    const result = await service.createCheckout(mockOrder());
    expect(result.sessionId).toContain('PAYPAL_MOCK_');
    expect(result.url).toContain('order_id=ord_test');
    expect(result.url).toContain('mock=1');
  });

  it('treats mock capture as completed', async () => {
    const service = new PaymentService(env);
    await expect(service.captureOrder('PAYPAL_MOCK_ord_test')).resolves.toEqual({
      captured: true,
      status: 'COMPLETED',
    });
  });
});
