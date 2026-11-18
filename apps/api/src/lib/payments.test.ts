import { describe, expect, it, vi } from 'vitest';
import { loadEnv } from '../env.js';
import {
  evaluate3dsPolicy,
  orderDiscountCents,
  PaymentService,
  type PayPalOrderDetails,
} from './payments.js';
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
    shippingAddress: {
      fullName: 'Ash Ketchum',
      line1: '1 Pallet Lane',
      city: 'Pallet Town',
      postalCode: '00001',
      country: 'Sweden',
    },
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

describe('evaluate3dsPolicy', () => {
  it('allows capture when liability shift is POSSIBLE with Y/Y', () => {
    expect(
      evaluate3dsPolicy({
        liability_shift: 'POSSIBLE',
        three_d_secure: { enrollment_status: 'Y', authentication_status: 'Y' },
      }).ok,
    ).toBe(true);
  });

  it('allows capture when not enrolled (NO + N)', () => {
    expect(
      evaluate3dsPolicy({
        liability_shift: 'NO',
        three_d_secure: { enrollment_status: 'N' },
      }).ok,
    ).toBe(true);
  });

  it('rejects when enrolled but authentication failed', () => {
    const result = evaluate3dsPolicy({
      liability_shift: 'NO',
      three_d_secure: { enrollment_status: 'Y', authentication_status: 'N' },
    });
    expect(result.ok).toBe(false);
  });

  it('rejects UNKNOWN liability shift', () => {
    expect(evaluate3dsPolicy({ liability_shift: 'UNKNOWN' }).ok).toBe(false);
  });

  it('allows when authentication_result is absent', () => {
    expect(evaluate3dsPolicy(undefined).ok).toBe(true);
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
      outcome: 'completed',
      status: 'COMPLETED',
      captureId: 'cap_PAYPAL_MOCK_ord_test',
    });
  });
});

describe('PaymentService (test stub)', () => {
  const env = loadEnv({
    PAYPAL_API_KEY: 'test_paypal_client',
    PAYPAL_SECRET_KEY: 'test_paypal_secret',
    PAYPAL_SCA_METHOD: 'SCA_ALWAYS',
  });

  it('builds card payment_source without payer or application_context', async () => {
    const service = new PaymentService(env);
    const result = await service.createCheckout(mockOrder(), { method: 'card' });
    expect(result.url).toBeNull();
    expect(result.sessionId).toContain('_card_');
  });

  it('returns approve URL for redirect method', async () => {
    const service = new PaymentService(env);
    const result = await service.createCheckout(mockOrder(), { method: 'redirect' });
    expect(result.url).toContain('checkoutnow');
  });

  it('returns approve URL for swish method', async () => {
    const service = new PaymentService(env);
    const result = await service.createCheckout(mockOrder(), { method: 'swish' });
    expect(result.url).toContain('checkoutnow');
    expect(result.sessionId).toContain('_swish_');
  });

  it('decides capture outcome from capture status not order status', async () => {
    const service = new PaymentService(env);
    service.fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/v1/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), {
          status: 200,
        });
      }
      if (url.includes('/capture')) {
        const body: PayPalOrderDetails = {
          id: 'PAYPAL1',
          status: 'COMPLETED',
          purchase_units: [
            {
              payments: {
                captures: [{ id: 'CAP1', status: 'DECLINED', processor_response: { response_code: '0500' } }],
              },
            },
          ],
        };
        return new Response(JSON.stringify(body), { status: 200 });
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    // Force non-stub path by using a non-test client id for this call only.
    const liveEnv = loadEnv({
      PAYPAL_API_KEY: 'live_looking_client',
      PAYPAL_SECRET_KEY: 'live_looking_secret',
    });
    const live = new PaymentService(liveEnv);
    live.fetchImpl = service.fetchImpl;

    const outcome = await live.captureOrder('PAYPAL1');
    expect(outcome.outcome).toBe('declined');
    expect(outcome.status).toBe('DECLINED');
  });

  it('verifies webhooks in stub mode only with transmission id valid', async () => {
    const service = new PaymentService(env);
    await expect(service.verifyWebhook({ 'paypal-transmission-id': 'valid' }, '{}')).resolves.toBe(
      true,
    );
    await expect(service.verifyWebhook({ 'paypal-transmission-id': 'forged' }, '{}')).resolves.toBe(
      false,
    );
  });
});

describe('PaymentService card payload (network stub)', () => {
  it('sends SCA method and only return/cancel URLs on card experience_context', async () => {
    let posted: unknown;
    const env = loadEnv({
      PAYPAL_API_KEY: 'real_client',
      PAYPAL_SECRET_KEY: 'real_secret',
      PAYPAL_SCA_METHOD: 'SCA_ALWAYS',
      CHECKOUT_SUCCESS_URL: 'https://shop.test/success',
      CHECKOUT_CANCEL_URL: 'https://shop.test/cart',
    });
    const service = new PaymentService(env);
    service.fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/v1/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), {
          status: 200,
        });
      }
      if (url.includes('/v2/checkout/orders') && init?.method === 'POST') {
        posted = JSON.parse(String(init.body));
        return new Response(JSON.stringify({ id: 'ORDER123', links: [] }), { status: 201 });
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const result = await service.createCheckout(mockOrder(), { method: 'card' });
    expect(result.sessionId).toBe('ORDER123');
    expect(result.url).toBeNull();

    const payload = posted as {
      payer?: unknown;
      application_context?: unknown;
      payment_source: {
        card: {
          attributes: { verification: { method: string } };
          experience_context: Record<string, string>;
        };
      };
    };
    expect(payload.payer).toBeUndefined();
    expect(payload.application_context).toBeUndefined();
    expect(payload.payment_source.card.attributes.verification.method).toBe('SCA_ALWAYS');
    expect(Object.keys(payload.payment_source.card.experience_context).sort()).toEqual([
      'cancel_url',
      'return_url',
    ]);
  });

  it('sends google_pay payment_source with SCA verification', async () => {
    let posted: unknown;
    const env = loadEnv({
      PAYPAL_API_KEY: 'real_client',
      PAYPAL_SECRET_KEY: 'real_secret',
      PAYPAL_SCA_METHOD: 'SCA_ALWAYS',
      CHECKOUT_SUCCESS_URL: 'https://shop.test/success',
      CHECKOUT_CANCEL_URL: 'https://shop.test/cart',
    });
    const service = new PaymentService(env);
    service.fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/v1/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), {
          status: 200,
        });
      }
      if (url.includes('/v2/checkout/orders') && init?.method === 'POST') {
        posted = JSON.parse(String(init.body));
        return new Response(JSON.stringify({ id: 'GPAY123', links: [] }), { status: 201 });
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const result = await service.createCheckout(mockOrder(), { method: 'google_pay' });
    expect(result.sessionId).toBe('GPAY123');
    expect(result.url).toBeNull();

    const payload = posted as {
      payment_source: {
        google_pay: {
          attributes: { verification: { method: string } };
        };
      };
    };
    expect(payload.payment_source.google_pay.attributes.verification.method).toBe('SCA_ALWAYS');
  });

  it('sends apple_pay payment_source for on-site capture', async () => {
    let posted: unknown;
    const env = loadEnv({
      PAYPAL_API_KEY: 'real_client',
      PAYPAL_SECRET_KEY: 'real_secret',
      CHECKOUT_SUCCESS_URL: 'https://shop.test/success',
      CHECKOUT_CANCEL_URL: 'https://shop.test/cart',
    });
    const service = new PaymentService(env);
    service.fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/v1/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), {
          status: 200,
        });
      }
      if (url.includes('/v2/checkout/orders') && init?.method === 'POST') {
        posted = JSON.parse(String(init.body));
        return new Response(JSON.stringify({ id: 'APAY123', links: [] }), { status: 201 });
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const result = await service.createCheckout(mockOrder(), { method: 'apple_pay' });
    expect(result.sessionId).toBe('APAY123');
    expect(result.url).toBeNull();

    const payload = posted as { payment_source: { apple_pay: Record<string, unknown> } };
    expect(payload.payment_source.apple_pay).toEqual({});
  });

  it('sends swish payment_source with auto-capture instruction', async () => {
    let posted: unknown;
    const env = loadEnv({
      PAYPAL_API_KEY: 'real_client',
      PAYPAL_SECRET_KEY: 'real_secret',
      CHECKOUT_SUCCESS_URL: 'https://shop.test/success',
      CHECKOUT_CANCEL_URL: 'https://shop.test/cart',
    });
    const service = new PaymentService(env);
    service.fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/v1/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), {
          status: 200,
        });
      }
      if (url.includes('/v2/checkout/orders') && init?.method === 'POST') {
        posted = JSON.parse(String(init.body));
        return new Response(
          JSON.stringify({
            id: 'SWISH123',
            links: [{ rel: 'payer-action', href: 'https://www.sandbox.paypal.com/swish' }],
          }),
          { status: 201 },
        );
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    const result = await service.createCheckout(mockOrder(), { method: 'swish' });
    expect(result.sessionId).toBe('SWISH123');
    expect(result.url).toBe('https://www.sandbox.paypal.com/swish');

    const payload = posted as {
      processing_instruction?: string;
      payment_source: {
        swish: {
          name: string;
          country_code: string;
          experience_context: Record<string, string>;
        };
      };
    };
    expect(payload.processing_instruction).toBe('ORDER_COMPLETE_ON_PAYMENT_APPROVAL');
    expect(payload.payment_source.swish.country_code).toBe('SE');
    expect(payload.payment_source.swish.name).toBe('Ash Ketchum');
    expect(payload.payment_source.swish.experience_context.locale).toBe('sv-SE');
  });

  it('pads a single-word Swish name so PayPal gets first + last', async () => {
    let posted: unknown;
    const env = loadEnv({
      PAYPAL_API_KEY: 'real_client',
      PAYPAL_SECRET_KEY: 'real_secret',
      CHECKOUT_SUCCESS_URL: 'https://shop.test/success',
      CHECKOUT_CANCEL_URL: 'https://shop.test/cart',
    });
    const service = new PaymentService(env);
    service.fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/v1/oauth2/token')) {
        return new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), {
          status: 200,
        });
      }
      if (url.includes('/v2/checkout/orders') && init?.method === 'POST') {
        posted = JSON.parse(String(init.body));
        return new Response(
          JSON.stringify({
            id: 'SWISH456',
            links: [{ rel: 'payer-action', href: 'https://www.sandbox.paypal.com/swish' }],
          }),
          { status: 201 },
        );
      }
      return new Response('{}', { status: 404 });
    }) as typeof fetch;

    await service.createCheckout(
      mockOrder({
        shippingAddress: {
          fullName: 'Kim',
          line1: 'Testgatan 1',
          city: 'Stockholm',
          postalCode: '11122',
          country: 'SE',
        },
      }),
      { method: 'swish' },
    );

    const payload = posted as { payment_source: { swish: { name: string } } };
    expect(payload.payment_source.swish.name).toBe('Kim Shopper');
  });
});
