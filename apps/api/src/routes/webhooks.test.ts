import { describe, expect, it, vi } from 'vitest';
import { PaymentService, type StripeLike } from '../lib/payments.js';
import { jsonRequest, makeApp, testEnv } from '../test/helpers.js';

function liveApp(client: StripeLike) {
  const env = testEnv({ STRIPE_SECRET_KEY: 'sk_test_real', STRIPE_WEBHOOK_SECRET: 'whsec_real' });
  const payments = new PaymentService(env, client);
  return makeApp({ env, payments });
}

describe('POST /api/webhooks/stripe', () => {
  it('acknowledges in mock mode without verifying', async () => {
    const { app } = makeApp();
    const { res, data } = await jsonRequest(app, 'POST', '/api/webhooks/stripe', {});
    expect(res.status).toBe(200);
    expect(data.mock).toBe(true);
  });

  it('marks the matching order paid on checkout.session.completed', async () => {
    const sessionId = 'cs_live_test';
    const { app, deps } = liveApp({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ id: sessionId, url: 'https://stripe.test/pay' }),
        },
      },
      webhooks: {
        constructEvent: vi
          .fn()
          .mockReturnValue({
            type: 'checkout.session.completed',
            data: { object: { id: sessionId } },
          }),
      },
    });

    const { data: checkout } = await jsonRequest(app, 'POST', '/api/checkout', {
      email: 'buyer@example.com',
      items: [{ productId: 'bb-151', quantity: 1 }],
    });
    expect((await deps.orders.get(checkout.orderId))?.status).toBe('pending');

    const { res } = await jsonRequest(
      app,
      'POST',
      '/api/webhooks/stripe',
      {},
      {
        'stripe-signature': 'valid-sig',
      },
    );
    expect(res.status).toBe(200);
    expect((await deps.orders.get(checkout.orderId))?.status).toBe('paid');
  });

  it('stores the Stripe invoice PDF on the order', async () => {
    const sessionId = 'cs_live_invoice';
    const { app, deps } = liveApp({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ id: sessionId, url: 'https://stripe.test/pay' }),
        },
      },
      webhooks: {
        constructEvent: vi.fn().mockReturnValue({
          type: 'checkout.session.completed',
          data: {
            object: {
              id: sessionId,
              invoice: { invoice_pdf: 'https://pay.stripe.com/invoice/inv_1/pdf' },
            },
          },
        }),
      },
    });

    const { data: checkout } = await jsonRequest(app, 'POST', '/api/checkout', {
      email: 'buyer@example.com',
      items: [{ productId: 'bb-151', quantity: 1 }],
    });

    await jsonRequest(
      app,
      'POST',
      '/api/webhooks/stripe',
      {},
      { 'stripe-signature': 'valid-sig' },
    );

    expect((await deps.orders.get(checkout.orderId))?.invoiceUrl).toBe(
      'https://pay.stripe.com/invoice/inv_1/pdf',
    );
  });

  it('cancels a fully refunded order and ignores a second refund event', async () => {
    const sessionId = 'cs_live_refund';
    let event: { type: string; data: { object: unknown } } = {
      type: 'checkout.session.completed',
      data: { object: { id: sessionId } },
    };
    const { app, deps } = liveApp({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ id: sessionId, url: 'https://stripe.test/pay' }),
        },
      },
      webhooks: { constructEvent: vi.fn().mockImplementation(() => event) },
    });

    const { data: checkout } = await jsonRequest(app, 'POST', '/api/checkout', {
      email: 'buyer@example.com',
      items: [{ productId: 'bb-151', quantity: 1 }],
    });
    await jsonRequest(app, 'POST', '/api/webhooks/stripe', {}, { 'stripe-signature': 'sig' });
    expect((await deps.orders.get(checkout.orderId))?.status).toBe('paid');

    event = {
      type: 'charge.refunded',
      data: { object: { metadata: { orderId: checkout.orderId }, refunded: true } },
    };
    const { res } = await jsonRequest(
      app,
      'POST',
      '/api/webhooks/stripe',
      {},
      { 'stripe-signature': 'sig' },
    );
    expect(res.status).toBe(200);
    expect((await deps.orders.get(checkout.orderId))?.status).toBe('cancelled');

    const again = await jsonRequest(
      app,
      'POST',
      '/api/webhooks/stripe',
      {},
      { 'stripe-signature': 'sig' },
    );
    expect(again.res.status).toBe(200);
    expect((await deps.orders.get(checkout.orderId))?.status).toBe('cancelled');
  });

  it('leaves the order paid when a refund is only partial', async () => {
    const sessionId = 'cs_live_partial';
    let orderId = '';
    const { app, deps } = liveApp({
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ id: sessionId, url: 'https://stripe.test/pay' }),
        },
      },
      webhooks: {
        constructEvent: vi.fn().mockImplementation(() => ({
          type: 'charge.refunded',
          data: { object: { metadata: { orderId }, refunded: false } },
        })),
      },
    });

    const { data: checkout } = await jsonRequest(app, 'POST', '/api/checkout', {
      email: 'buyer@example.com',
      items: [{ productId: 'bb-151', quantity: 1 }],
    });
    orderId = checkout.orderId;
    await deps.orders.setStatus(orderId, 'paid');

    const { res } = await jsonRequest(
      app,
      'POST',
      '/api/webhooks/stripe',
      {},
      { 'stripe-signature': 'sig' },
    );
    expect(res.status).toBe(200);
    expect((await deps.orders.get(orderId))?.status).toBe('paid');
  });

  it('rejects a request without a signature header', async () => {
    const { app } = liveApp({
      checkout: { sessions: { create: vi.fn() } },
      webhooks: { constructEvent: vi.fn() },
    });
    const { res } = await jsonRequest(app, 'POST', '/api/webhooks/stripe', {});
    expect(res.status).toBe(400);
  });

  it('rejects an invalid signature', async () => {
    const { app } = liveApp({
      checkout: { sessions: { create: vi.fn() } },
      webhooks: {
        constructEvent: vi.fn().mockImplementation(() => {
          throw new Error('bad signature');
        }),
      },
    });
    const { res } = await jsonRequest(
      app,
      'POST',
      '/api/webhooks/stripe',
      {},
      {
        'stripe-signature': 'bad',
      },
    );
    expect(res.status).toBe(400);
  });

  it('ignores unrelated event types', async () => {
    const { app } = liveApp({
      checkout: { sessions: { create: vi.fn() } },
      webhooks: {
        constructEvent: vi
          .fn()
          .mockReturnValue({ type: 'payment_intent.created', data: { object: {} } }),
      },
    });
    const { res, data } = await jsonRequest(
      app,
      'POST',
      '/api/webhooks/stripe',
      {},
      {
        'stripe-signature': 'sig',
      },
    );
    expect(res.status).toBe(200);
    expect(data.received).toBe(true);
  });
});
