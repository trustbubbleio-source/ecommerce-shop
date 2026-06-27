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
    expect(deps.orders.get(checkout.orderId)?.status).toBe('pending');

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
    expect(deps.orders.get(checkout.orderId)?.status).toBe('paid');
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
