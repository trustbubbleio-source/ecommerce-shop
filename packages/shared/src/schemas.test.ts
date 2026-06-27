import { describe, expect, it } from 'vitest';
import {
  addressSchema,
  checkoutInputSchema,
  contactInputSchema,
  loginInputSchema,
  registerInputSchema,
} from './schemas.js';

describe('registerInputSchema', () => {
  it('accepts a valid registration and lowercases the email', () => {
    const parsed = registerInputSchema.parse({
      name: 'Ash Ketchum',
      email: 'Ash@Pallet.Town',
      password: 'pikachu123',
    });
    expect(parsed.email).toBe('ash@pallet.town');
  });

  it('rejects short passwords', () => {
    const result = registerInputSchema.safeParse({
      name: 'Ash',
      email: 'ash@pallet.town',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid emails', () => {
    expect(
      registerInputSchema.safeParse({ name: 'A', email: 'nope', password: 'longenough' }).success,
    ).toBe(false);
  });
});

describe('loginInputSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginInputSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });

  it('requires a password', () => {
    expect(loginInputSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('addressSchema', () => {
  it('accepts a complete address', () => {
    expect(
      addressSchema.safeParse({
        fullName: 'Ash Ketchum',
        line1: '1 Pallet Lane',
        city: 'Pallet Town',
        postalCode: '00001',
        country: 'Kanto',
      }).success,
    ).toBe(true);
  });

  it('requires the mandatory fields', () => {
    expect(addressSchema.safeParse({ fullName: '', line1: '', city: '' }).success).toBe(false);
  });
});

describe('checkoutInputSchema', () => {
  it('requires at least one item', () => {
    expect(checkoutInputSchema.safeParse({ items: [], email: 'a@b.com' }).success).toBe(false);
  });

  it('accepts a valid checkout payload', () => {
    expect(
      checkoutInputSchema.safeParse({
        items: [{ productId: 'bb-151', quantity: 2 }],
        email: 'buyer@example.com',
      }).success,
    ).toBe(true);
  });

  it('rejects quantities above the per-line cap', () => {
    expect(
      checkoutInputSchema.safeParse({
        items: [{ productId: 'bb-151', quantity: 100 }],
        email: 'buyer@example.com',
      }).success,
    ).toBe(false);
  });
});

describe('contactInputSchema', () => {
  it('requires a message of at least 10 characters', () => {
    expect(
      contactInputSchema.safeParse({
        name: 'A',
        email: 'a@b.com',
        subject: 'Hi',
        message: 'too short',
      }).success,
    ).toBe(false);
  });

  it('accepts a valid contact message', () => {
    expect(
      contactInputSchema.safeParse({
        name: 'Buyer',
        email: 'buyer@example.com',
        subject: 'Order question',
        message: 'I would like to know about shipping times to Europe.',
      }).success,
    ).toBe(true);
  });
});
