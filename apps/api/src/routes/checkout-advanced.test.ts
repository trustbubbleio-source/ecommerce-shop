import { describe, expect, it, vi } from 'vitest';
import { PaymentService } from '../lib/payments.js';
import { jsonRequest, makeApp, TEST_SHIPPING_ADDRESS, testEnv } from '../test/helpers.js';

const checkoutBody = (overrides: Record<string, unknown> = {}) => ({
  email: 'buyer@example.com',
  items: [{ productId: 'bb-151', quantity: 1 }],
  shippingAddress: TEST_SHIPPING_ADDRESS,
  ...overrides,
});

describe('GET /api/checkout/config', () => {
  it('returns mock provider when PayPal is disabled', async () => {
    const { app } = makeApp();
    const { res, data } = await jsonRequest(app, 'GET', '/api/checkout/config');
    expect(res.status).toBe(200);
    expect(data.provider).toBe('mock');
    expect(data.methods.cardFields).toBe(false);
    expect(data.methods.redirect).toBe(true);
  });

  it('hides card fields when flag is off', async () => {
    const env = testEnv({
      PAYPAL_API_KEY: 'test_paypal_client',
      PAYPAL_SECRET_KEY: 'test_secret',
      PAYPAL_CARD_FIELDS: 'off',
    });
    const { app } = makeApp({ env, payments: new PaymentService(env) });
    const { data } = await jsonRequest(app, 'GET', '/api/checkout/config');
    expect(data.provider).toBe('paypal');
    expect(data.methods.cardFields).toBe(false);
    expect(data.methods.googlePayButton).toBe(false);
    expect(data.methods.applePayButton).toBe(false);
    expect(data.clientId).toBe('test_paypal_client');
  });

  it('enables googlePayButton with the card fields kill-switch', async () => {
    const env = testEnv({
      PAYPAL_API_KEY: 'test_paypal_client',
      PAYPAL_SECRET_KEY: 'test_secret',
      PAYPAL_CARD_FIELDS: 'on',
    });
    const { app } = makeApp({ env, payments: new PaymentService(env) });
    const { data } = await jsonRequest(app, 'GET', '/api/checkout/config');
    expect(data.methods.cardFields).toBe(true);
    expect(data.methods.paypalButton).toBe(true);
    expect(data.methods.googlePayButton).toBe(true);
    expect(data.methods.applePayButton).toBe(true);
    expect(data.methods.swishButton).toBe(true);
  });

  it('enables card fields for admins when flag is admin', async () => {
    const env = testEnv({
      PAYPAL_API_KEY: 'test_paypal_client',
      PAYPAL_SECRET_KEY: 'test_secret',
      PAYPAL_CARD_FIELDS: 'admin',
    });
    const created = makeApp({ env, payments: new PaymentService(env) });
    const { hashPassword } = await import('../lib/password.js');
    const passwordHash = await hashPassword('adminpass1');
    await created.deps.users.create({
      email: 'admin-canary@example.com',
      name: 'Admin',
      passwordHash,
      role: 'admin',
      emailVerifiedAt: new Date().toISOString(),
    });
    const { data: login } = await jsonRequest(created.app, 'POST', '/api/auth/login', {
      email: 'admin-canary@example.com',
      password: 'adminpass1',
    });

    const { data: guest } = await jsonRequest(created.app, 'GET', '/api/checkout/config');
    expect(guest.methods.cardFields).toBe(false);

    const { data: admin } = await jsonRequest(created.app, 'GET', '/api/checkout/config', undefined, {
      authorization: `Bearer ${login.token}`,
    });
    expect(admin.methods.cardFields).toBe(true);
  });
});

describe('POST /api/checkout with paymentMethod', () => {
  it('defaults to redirect behaviour', async () => {
    const env = testEnv({
      PAYPAL_API_KEY: 'test_paypal_client',
      PAYPAL_SECRET_KEY: 'test_secret',
    });
    const { app, deps } = makeApp({ env, payments: new PaymentService(env) });
    const { res, data } = await jsonRequest(app, 'POST', '/api/checkout', checkoutBody());
    expect(res.status).toBe(201);
    expect(data.url).toContain('checkoutnow');
    expect(data.paypalOrderId).toBeTruthy();
    expect((await deps.orders.get(data.orderId))?.status).toBe('pending');
  });

  it('returns paypalOrderId without url for card method', async () => {
    const env = testEnv({
      PAYPAL_API_KEY: 'test_paypal_client',
      PAYPAL_SECRET_KEY: 'test_secret',
    });
    const { app, deps } = makeApp({ env, payments: new PaymentService(env) });
    const { res, data } = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      checkoutBody({ paymentMethod: 'card' }),
    );
    expect(res.status).toBe(201);
    expect(data.url).toBeNull();
    expect(data.paypalOrderId).toContain('_card_');
    expect((await deps.orders.get(data.orderId))?.status).toBe('pending');
  });

  it('returns paypalOrderId without url for google_pay method', async () => {
    const env = testEnv({
      PAYPAL_API_KEY: 'test_paypal_client',
      PAYPAL_SECRET_KEY: 'test_secret',
    });
    const { app, deps } = makeApp({ env, payments: new PaymentService(env) });
    const { res, data } = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      checkoutBody({ paymentMethod: 'google_pay' }),
    );
    expect(res.status).toBe(201);
    expect(data.url).toBeNull();
    expect(data.paypalOrderId).toContain('_google_pay_');
    expect((await deps.orders.get(data.orderId))?.status).toBe('pending');
  });

  it('returns paypalOrderId without url for apple_pay method', async () => {
    const env = testEnv({
      PAYPAL_API_KEY: 'test_paypal_client',
      PAYPAL_SECRET_KEY: 'test_secret',
    });
    const { app, deps } = makeApp({ env, payments: new PaymentService(env) });
    const { res, data } = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      checkoutBody({ paymentMethod: 'apple_pay' }),
    );
    expect(res.status).toBe(201);
    expect(data.url).toBeNull();
    expect(data.paypalOrderId).toContain('_apple_pay_');
    expect((await deps.orders.get(data.orderId))?.status).toBe('pending');
  });
});

describe('payment-session and capture', () => {
  it('creates a fresh PayPal order without a second stock reservation', async () => {
    const env = testEnv({
      PAYPAL_API_KEY: 'test_paypal_client',
      PAYPAL_SECRET_KEY: 'test_secret',
    });
    const { app, deps } = makeApp({ env, payments: new PaymentService(env) });
    const product = await deps.products.getByIdOrSlug('bb-151');
    const stockBefore = product!.stock;

    const { data: created } = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      checkoutBody({ paymentMethod: 'card' }),
    );
    const afterCheckout = (await deps.products.getByIdOrSlug('bb-151'))!.stock;
    expect(afterCheckout).toBe(stockBefore - 1);

    const firstSession = created.paypalOrderId as string;
    const { res, data } = await jsonRequest(
      app,
      'POST',
      `/api/checkout/${created.orderId}/payment-session`,
      { paymentMethod: 'card' },
    );
    expect(res.status).toBe(200);
    expect(data.paypalOrderId).not.toBe(firstSession);
    expect((await deps.products.getByIdOrSlug('bb-151'))!.stock).toBe(afterCheckout);
  });

  it('settles previously captured PayPal order instead of creating another', async () => {
    const env = testEnv({
      PAYPAL_API_KEY: 'test_paypal_client',
      PAYPAL_SECRET_KEY: 'test_secret',
    });
    const payments = new PaymentService(env);
    const { app, deps } = makeApp({ env, payments });
    const { data: created } = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      checkoutBody({ paymentMethod: 'card' }),
    );

    payments.getOrder = async (id) => ({
      id,
      status: 'COMPLETED',
      purchase_units: [
        {
          custom_id: created.orderId,
          amount: { currency_code: 'SEK', value: ((await deps.orders.get(created.orderId))!.total / 100).toFixed(2) },
          payments: { captures: [{ id: 'cap1', status: 'COMPLETED' }] },
        },
      ],
    });
    payments.captureOrder = async () => ({
      outcome: 'completed',
      status: 'COMPLETED',
      captureId: 'cap1',
    });

    const { res, data } = await jsonRequest(
      app,
      'POST',
      `/api/checkout/${created.orderId}/payment-session`,
      { paymentMethod: 'card' },
    );
    expect(res.status).toBe(200);
    expect(data.status).toBe('paid');
    expect((await deps.orders.get(created.orderId))?.status).toBe('paid');
  });

  it('rejects capture when paypalOrderId does not match the session', async () => {
    const env = testEnv({
      PAYPAL_API_KEY: 'test_paypal_client',
      PAYPAL_SECRET_KEY: 'test_secret',
    });
    const { app } = makeApp({ env, payments: new PaymentService(env) });
    const { data: created } = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      checkoutBody({ paymentMethod: 'card' }),
    );

    const { res, data } = await jsonRequest(
      app,
      'POST',
      `/api/checkout/${created.orderId}/capture`,
      { paypalOrderId: 'WRONG_SESSION' },
    );
    expect(res.status).toBe(409);
    expect(data.code).toBe('ORDER_MISMATCH');
  });

  it('is idempotent when the order is already paid', async () => {
    const env = testEnv({
      PAYPAL_API_KEY: 'test_paypal_client',
      PAYPAL_SECRET_KEY: 'test_secret',
    });
    const payments = new PaymentService(env);
    const { app, deps } = makeApp({ env, payments });
    const { data: created } = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      checkoutBody({ paymentMethod: 'card' }),
    );

    const order = (await deps.orders.get(created.orderId))!;
    payments.getOrder = async () => ({
      id: created.paypalOrderId,
      status: 'COMPLETED',
      purchase_units: [
        {
          custom_id: order.id,
          amount: { currency_code: 'SEK', value: (order.total / 100).toFixed(2) },
          payments: { captures: [{ id: 'cap1', status: 'COMPLETED' }] },
        },
      ],
    });
    payments.captureOrder = vi.fn(async () => ({
      outcome: 'completed' as const,
      status: 'COMPLETED',
      captureId: 'cap1',
    }));

    const first = await jsonRequest(app, 'POST', `/api/checkout/${created.orderId}/capture`, {
      paypalOrderId: created.paypalOrderId,
    });
    expect(first.res.status).toBe(200);

    const second = await jsonRequest(app, 'POST', `/api/checkout/${created.orderId}/capture`, {
      paypalOrderId: created.paypalOrderId,
    });
    expect(second.res.status).toBe(200);
    expect(second.data.status).toBe('paid');
    // Second call short-circuits before capture because order is already paid.
    expect(payments.captureOrder).toHaveBeenCalledTimes(1);
  });

  it('returns 402 when 3DS policy fails', async () => {
    const env = testEnv({
      PAYPAL_API_KEY: 'test_paypal_client',
      PAYPAL_SECRET_KEY: 'test_secret',
    });
    const payments = new PaymentService(env);
    const { app, deps } = makeApp({ env, payments });
    const { data: created } = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      checkoutBody({ paymentMethod: 'card' }),
    );
    const order = (await deps.orders.get(created.orderId))!;

    payments.getOrder = async () => ({
      id: created.paypalOrderId,
      status: 'APPROVED',
      purchase_units: [
        {
          custom_id: order.id,
          amount: { currency_code: 'SEK', value: (order.total / 100).toFixed(2) },
        },
      ],
      payment_source: {
        card: {
          authentication_result: {
            liability_shift: 'NO',
            three_d_secure: { enrollment_status: 'Y', authentication_status: 'N' },
          },
        },
      },
    });

    const { res, data } = await jsonRequest(
      app,
      'POST',
      `/api/checkout/${created.orderId}/capture`,
      { paypalOrderId: created.paypalOrderId },
    );
    expect(res.status).toBe(402);
    expect(data.code).toBe('SCA_FAILED');
    expect((await deps.orders.get(created.orderId))?.status).toBe('pending');
  });

  it('returns 402 when Google Pay 3DS policy fails', async () => {
    const env = testEnv({
      PAYPAL_API_KEY: 'test_paypal_client',
      PAYPAL_SECRET_KEY: 'test_secret',
    });
    const payments = new PaymentService(env);
    const { app, deps } = makeApp({ env, payments });
    const { data: created } = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      checkoutBody({ paymentMethod: 'google_pay' }),
    );
    expect(created.url).toBeNull();
    expect(created.paypalOrderId).toBeTruthy();
    const order = (await deps.orders.get(created.orderId))!;

    payments.getOrder = async () => ({
      id: created.paypalOrderId,
      status: 'APPROVED',
      purchase_units: [
        {
          custom_id: order.id,
          amount: { currency_code: 'SEK', value: (order.total / 100).toFixed(2) },
        },
      ],
      payment_source: {
        google_pay: {
          card: {
            authentication_result: {
              liability_shift: 'NO',
              three_d_secure: { enrollment_status: 'Y', authentication_status: 'N' },
            },
          },
        },
      },
    });

    const { res, data } = await jsonRequest(
      app,
      'POST',
      `/api/checkout/${created.orderId}/capture`,
      { paypalOrderId: created.paypalOrderId },
    );
    expect(res.status).toBe(402);
    expect(data.code).toBe('SCA_FAILED');
    expect((await deps.orders.get(created.orderId))?.status).toBe('pending');
  });

  it('returns 402 when capture is declined', async () => {
    const env = testEnv({
      PAYPAL_API_KEY: 'test_paypal_client',
      PAYPAL_SECRET_KEY: 'test_secret',
    });
    const payments = new PaymentService(env);
    const { app, deps } = makeApp({ env, payments });
    const { data: created } = await jsonRequest(
      app,
      'POST',
      '/api/checkout',
      checkoutBody({ paymentMethod: 'card' }),
    );
    const order = (await deps.orders.get(created.orderId))!;

    payments.getOrder = async () => ({
      id: created.paypalOrderId,
      status: 'APPROVED',
      purchase_units: [
        {
          custom_id: order.id,
          amount: { currency_code: 'SEK', value: (order.total / 100).toFixed(2) },
        },
      ],
    });
    payments.captureOrder = async () => ({
      outcome: 'declined',
      status: 'DECLINED',
      responseCode: '0500',
    });

    const { res, data } = await jsonRequest(
      app,
      'POST',
      `/api/checkout/${created.orderId}/capture`,
      { paypalOrderId: created.paypalOrderId },
    );
    expect(res.status).toBe(402);
    expect(data.code).toBe('PAYMENT_DECLINED');
    expect(data.retryable).toBe(true);
    expect((await deps.orders.get(created.orderId))?.status).toBe('pending');
  });
});
