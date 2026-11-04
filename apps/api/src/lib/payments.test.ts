import type { Order } from '@akknerds/shared';
import { describe, expect, it, vi } from 'vitest';
import { loadEnv } from '../env.js';
import {
  orderDiscountCents,
  PaymentService,
  swishPaymentReference,
  type StripeLike,
} from './payments.js';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ord_test',
    email: 'buyer@example.com',
    lines: [{ productId: 'a', name: 'Booster Box', unitPrice: 5000, quantity: 1 }],
    subtotal: 5000,
    shipping: 599,
    total: 5599,
    currency: 'sek',
    status: 'pending',
    channel: 'online',
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
    expect(params.cancel_url).toBe('https://shop.test/cart?order_id=ord_test');
    expect(params.payment_intent_data).toEqual({ metadata: { orderId: 'ord_test' } });
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

  it('creates a one-time Stripe coupon when the order total is discounted', async () => {
    const createSession = vi.fn().mockResolvedValue({ id: 'cs', url: 'https://stripe.test/pay' });
    const createCoupon = vi.fn().mockResolvedValue({ id: 'coup_10off' });
    const service = new PaymentService(env, {
      checkout: { sessions: { create: createSession } },
      coupons: { create: createCoupon },
      webhooks: { constructEvent: vi.fn() },
    });
    const order = makeOrder({ subtotal: 5000, shipping: 599, total: 5039 }); // 10% off goods+ship
    expect(orderDiscountCents(order)).toBe(560);

    await service.createCheckout(order);
    expect(createCoupon).toHaveBeenCalledWith(
      expect.objectContaining({ amount_off: 560, currency: 'sek', duration: 'once' }),
    );
    expect(createSession.mock.calls[0]![0].discounts).toEqual([{ coupon: 'coup_10off' }]);
    expect(createSession.mock.calls[0]![0].metadata.discountCents).toBe('560');
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

  it('creates an in-store Swish Checkout session in SEK', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'cs_swish', url: 'https://stripe.test/swish' });
    const service = new PaymentService(
      loadEnv({
        STRIPE_SECRET_KEY: 'sk_test_real',
        STRIPE_WEBHOOK_SECRET: 'whsec_real',
        WEB_ORIGIN: 'https://shop.test',
        STRIPE_INSTORE_PAYMENT_METHOD_CONFIG: 'pmc_instore',
      }),
      {
        checkout: { sessions: { create } },
        webhooks: { constructEvent: vi.fn() },
      },
    );

    const order = makeOrder({
      id: 'ord_swish_ref_1',
      currency: 'sek',
      shipping: 0,
      total: 5000,
      subtotal: 5000,
      channel: 'in_store',
    });
    const result = await service.createInstoreSwishCheckout(order, { slug: 'charizard-ex' });
    expect(result).toEqual({ sessionId: 'cs_swish', url: 'https://stripe.test/swish' });

    const params = create.mock.calls[0]![0];
    expect(params.line_items[0].price_data.currency).toBe('sek');
    expect(params.metadata).toEqual({ orderId: 'ord_swish_ref_1', channel: 'in_store' });
    expect(params.payment_method_options.swish.reference).toBe(
      swishPaymentReference('ord_swish_ref_1'),
    );
    expect(params.payment_method_configurations).toBe('pmc_instore');
    expect(params.success_url).toContain('/admin/instore/charizard-ex?paid=1');
    expect(params.cancel_url).toContain('cancelled=1');
    expect(params).not.toHaveProperty('payment_method_types');
  });

});

describe('swishPaymentReference', () => {
  it('keeps letters, numbers, and hyphens within 35 chars', () => {
    expect(swishPaymentReference('ord_abc_123')).toBe('ord-abc-123');
    expect(swishPaymentReference('a'.repeat(40)).length).toBe(35);
  });
});
