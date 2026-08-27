import { describe, expect, it } from 'vitest';
import { loadEnv } from './env.js';

describe('loadEnv', () => {
  it('applies sensible defaults from an empty source', () => {
    const env = loadEnv({});
    expect(env.port).toBe(4000);
    expect(env.webOrigins).toEqual(['http://localhost:5173']);
    expect(env.stripeEnabled).toBe(false);
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

  it('does not enable stripe for a non sk_ key', () => {
    expect(loadEnv({ STRIPE_SECRET_KEY: 'pk_test_realvalue123' }).stripeEnabled).toBe(false);
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
