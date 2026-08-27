import type { Order } from '@akknerds/shared';
import { describe, expect, it, vi } from 'vitest';
import { loadEnv } from '../env.js';
import { PaymentService, type StripeLike } from './payments.js';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ord_test',
    email: 'buyer@example.com',
    lines: [{ productId: 'a', name: 'Booster Box', unitPrice: 5000, quantity: 1 }],
    subtotal: 5000,
    shipping: 599,
    total: 5599,
    currency: 'eur',
    status: 'pending',
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('PaymentService (mock mode)', () => {
  const env = loadEnv({});

  it('is disabled without a key', () => {
    expect(new PaymentService(env).enabled).toBe(false);
  });

  it('returns a local success URL', async () => {
    const service = new PaymentService(env);
    const result = await service.createCheckout(makeOrder());
    expect(result.sessionId).toBe('cs_mock_ord_test');
    expect(result.url).toContain('order_id=ord_test');
    expect(result.url).toContain('mock=1');
  });

  it('throws when constructing an event without Stripe', () => {
    expect(() => new PaymentService(env).constructEvent('{}', 'sig')).toThrow(/not configured/);
  });
});

describe('PaymentService (live mode, injected client)', () => {
  const env = loadEnv({
    STRIPE_SECRET_KEY: 'sk_test_real',
    STRIPE_WEBHOOK_SECRET: 'whsec_real',
    CHECKOUT_SUCCESS_URL: 'https://shop.test/success',
    CHECKOUT_CANCEL_URL: 'https://shop.test/cart',
  });

  it('creates a Stripe session with line items including shipping', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'cs_live_1', url: 'https://stripe.test/pay' });
    const client: StripeLike = {
      checkout: { sessions: { create } },
      webhooks: { constructEvent: vi.fn() },
    };
    const service = new PaymentService(env, client);
    expect(service.enabled).toBe(true);

    const result = await service.createCheckout(makeOrder());
    expect(result).toEqual({ sessionId: 'cs_live_1', url: 'https://stripe.test/pay' });

    const params = create.mock.calls[0]![0];
    expect(params.line_items).toHaveLength(2); // product + shipping
    expect(params.line_items.at(-1).price_data.product_data.name).toBe('Shipping');
    expect(params.customer_email).toBe('buyer@example.com');
    expect(params.metadata.orderId).toBe('ord_test');
    expect(params.invoice_creation).toEqual({
      enabled: true,
      invoice_data: {
        description: 'One More Rip order ord_test',
        metadata: { orderId: 'ord_test' },
        footer: 'One More Rip · Hallandsvägen 21, 269 36 Båstad, Sweden',
      },
    });
  });

  it('omits the shipping line when shipping is free', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'cs', url: 'https://stripe.test/pay' });
    const service = new PaymentService(env, {
      checkout: { sessions: { create } },
      webhooks: { constructEvent: vi.fn() },
    });
    await service.createCheckout(makeOrder({ shipping: 0 }));
    expect(create.mock.calls[0]![0].line_items).toHaveLength(1);
  });

  it('throws when Stripe returns no URL', async () => {
    const service = new PaymentService(env, {
      checkout: { sessions: { create: vi.fn().mockResolvedValue({ id: 'cs', url: null }) } },
      webhooks: { constructEvent: vi.fn() },
    });
    await expect(service.createCheckout(makeOrder())).rejects.toThrow(/checkout URL/);
  });

  it('delegates webhook verification to Stripe', () => {
    const constructEvent = vi
      .fn()
      .mockReturnValue({ type: 'checkout.session.completed', data: { object: {} } });
    const service = new PaymentService(env, {
      checkout: { sessions: { create: vi.fn() } },
      webhooks: { constructEvent },
    });
    const event = service.constructEvent('payload', 'sig');
    expect(constructEvent).toHaveBeenCalledWith('payload', 'sig', 'whsec_real');
    expect(event.type).toBe('checkout.session.completed');
  });

  it('resolves an invoice PDF from an expanded checkout session', async () => {
    const retrieve = vi.fn().mockResolvedValue({
      id: 'cs_live_1',
      invoice: { invoice_pdf: 'https://pay.stripe.com/invoice/inv_1/pdf' },
    });
    const service = new PaymentService(env, {
      checkout: { sessions: { create: vi.fn(), retrieve } },
      webhooks: { constructEvent: vi.fn() },
    });
    await expect(service.resolveInvoiceDocument('cs_live_1')).resolves.toEqual({
      url: 'https://pay.stripe.com/invoice/inv_1/pdf',
      label: 'Invoice.pdf',
    });
  });

  it('falls back to the hosted receipt when no invoice exists', async () => {
    const retrieve = vi.fn().mockResolvedValue({
      id: 'cs_live_1',
      invoice: null,
      payment_intent: { latest_charge: { receipt_url: 'https://pay.stripe.com/receipts/abc' } },
    });
    const service = new PaymentService(env, {
      checkout: { sessions: { create: vi.fn(), retrieve } },
      webhooks: { constructEvent: vi.fn() },
    });
    await expect(service.resolveInvoiceDocument('cs_live_1')).resolves.toEqual({
      url: 'https://pay.stripe.com/receipts/abc',
      label: 'Receipt',
    });
  });
});
