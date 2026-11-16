import { describe, expect, it } from 'vitest';
import { assertProductionEnv, loadEnv } from './env.js';

describe('loadEnv paypal', () => {
  it('defaults to mock when credentials are missing', () => {
    const env = loadEnv({ PAYPAL_API_KEY: '', PAYPAL_SECRET_KEY: '' });
    expect(env.paypalEnabled).toBe(false);
    expect(env.paypalMode).toBe('sandbox');
  });

  it('enables paypal when both key and secret are set', () => {
    const env = loadEnv({
      PAYPAL_API_KEY: 'client-id-value',
      PAYPAL_SECRET_KEY: 'client-secret-value',
    });
    expect(env.paypalEnabled).toBe(true);
    expect(env.paypalClientId).toBe('client-id-value');
    expect(env.paypalClientSecret).toBe('client-secret-value');
  });

  it('accepts PAYPAL_MODE=live', () => {
    expect(
      loadEnv({
        PAYPAL_API_KEY: 'id',
        PAYPAL_SECRET_KEY: 'secret',
        PAYPAL_MODE: 'live',
      }).paypalMode,
    ).toBe('live');
  });

  it('parses advanced checkout flags with defaults', () => {
    const env = loadEnv({
      PAYPAL_API_KEY: 'id',
      PAYPAL_SECRET_KEY: 'secret',
    });
    expect(env.paypalCardFields).toBe('off');
    expect(env.paypalScaMethod).toBe('SCA_ALWAYS');
    expect(env.pendingOrderTtlMinutes).toBe(30);
    expect(env.paypalWebhookId).toBe('');
  });

  it('boots in production without PAYPAL_WEBHOOK_ID but keeps PayPal enabled', () => {
    const env = loadEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://localhost/db',
      JWT_SECRET: 'x'.repeat(40),
      RESEND_API_KEY: 're_live_key',
      PAYPAL_API_KEY: 'id',
      PAYPAL_SECRET_KEY: 'secret',
      PAYPAL_MODE: 'live',
      CHECKOUT_SUCCESS_URL: 'https://shop.example/success',
      CHECKOUT_CANCEL_URL: 'https://shop.example/cart',
    });
    expect(() =>
      assertProductionEnv(env, {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost/db',
        RESEND_API_KEY: 're_live_key',
      }),
    ).not.toThrow();
    expect(env.paypalWebhookId).toBe('');
  });
});

describe('assertProductionEnv', () => {
  it('requires paypal or explicit mock flag in production', () => {
    const env = loadEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://localhost/db',
      JWT_SECRET: 'x'.repeat(40),
      RESEND_API_KEY: 're_live_key',
    });
    expect(() =>
      assertProductionEnv(env, {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://localhost/db',
        JWT_SECRET: 'x'.repeat(40),
        RESEND_API_KEY: 're_live_key',
      }),
    ).toThrow(/PAYPAL_API_KEY/);
  });
});
