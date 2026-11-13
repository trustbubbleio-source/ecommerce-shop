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
