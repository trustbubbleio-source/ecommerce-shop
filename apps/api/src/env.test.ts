import { describe, expect, it } from 'vitest';
import { assertProductionEnv, DEV_JWT_SECRET, loadEnv } from './env.js';

describe('loadEnv', () => {
  it('applies sensible defaults from an empty source', () => {
    const env = loadEnv({});
    expect(env.port).toBe(4000);
    expect(env.webOrigins).toEqual(['http://localhost:5173']);
    expect(env.stripeEnabled).toBe(false);
    expect(env.allowMockPayments).toBe(false);
    expect(env.email.contactInbox).toBe('contact@onemorerip.cards');
    expect(env.email.ordersInbox).toBe('order@onemorerip.cards');
  });

  it('parses a comma-separated origin list', () => {
    const env = loadEnv({ WEB_ORIGIN: 'http://a.com, http://b.com ,' });
    expect(env.webOrigins).toEqual(['http://a.com', 'http://b.com']);
  });

  it('treats placeholder keys as disabled', () => {
    expect(loadEnv({ STRIPE_SECRET_KEY: 'sk_test_xxx' }).stripeEnabled).toBe(false);
    expect(loadEnv({ STRIPE_SECRET_KEY: '' }).stripeEnabled).toBe(false);
  });

  it('enables stripe for a real secret key', () => {
    expect(loadEnv({ STRIPE_SECRET_KEY: 'sk_test_realvalue123' }).stripeEnabled).toBe(true);
  });

  it('enables stripe for a restricted key', () => {
    expect(loadEnv({ STRIPE_SECRET_KEY: 'rk_test_realvalue123' }).stripeEnabled).toBe(true);
  });

  it('does not enable stripe for a publishable key', () => {
    expect(loadEnv({ STRIPE_SECRET_KEY: 'pk_test_realvalue123' }).stripeEnabled).toBe(false);
  });

  it('reads ALLOW_MOCK_PAYMENTS', () => {
    expect(loadEnv({ ALLOW_MOCK_PAYMENTS: 'true' }).allowMockPayments).toBe(true);
    expect(loadEnv({ ALLOW_MOCK_PAYMENTS: '0' }).allowMockPayments).toBe(false);
  });

  it('reads the configured port', () => {
    expect(loadEnv({ PORT: '5000' }).port).toBe(5000);
  });

  it('enables the database when DATABASE_URL is a postgres URL', () => {
    expect(
      loadEnv({ DATABASE_URL: 'postgresql://user:pass@localhost:5432/akknerds' }).databaseEnabled,
    ).toBe(true);
    expect(loadEnv({}).databaseEnabled).toBe(false);
  });
});

describe('assertProductionEnv', () => {
  const prod = { NODE_ENV: 'production' };

  it('allows a fully configured production env', () => {
    const env = loadEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/akknerds',
      JWT_SECRET: 'a'.repeat(32),
      STRIPE_SECRET_KEY: 'sk_test_realvalue123',
      STRIPE_WEBHOOK_SECRET: 'whsec_realvalue',
      RESEND_API_KEY: 're_realvalue123',
    });
    expect(() => assertProductionEnv(env, prod)).not.toThrow();
  });

  it('allows mock payments only with an explicit flag', () => {
    const env = loadEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/akknerds',
      JWT_SECRET: 'a'.repeat(32),
      ALLOW_MOCK_PAYMENTS: 'true',
      RESEND_API_KEY: 're_realvalue123',
    });
    expect(() => assertProductionEnv(env, prod)).not.toThrow();
  });

  it('rejects the default JWT secret and missing database', () => {
    const env = loadEnv({ JWT_SECRET: DEV_JWT_SECRET });
    expect(() => assertProductionEnv(env, prod)).toThrow(/DATABASE_URL|JWT_SECRET/);
  });

  it('rejects mock stripe without ALLOW_MOCK_PAYMENTS', () => {
    const env = loadEnv({
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/akknerds',
      JWT_SECRET: 'a'.repeat(32),
      RESEND_API_KEY: 're_realvalue123',
    });
    expect(() => assertProductionEnv(env, prod)).toThrow(/STRIPE_SECRET_KEY|ALLOW_MOCK_PAYMENTS/);
  });

  it('is a no-op outside production', () => {
    const env = loadEnv({});
    expect(() => assertProductionEnv(env, { NODE_ENV: 'development' })).not.toThrow();
  });
});
