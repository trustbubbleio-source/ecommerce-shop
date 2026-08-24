import { describe, expect, it } from 'vitest';
import {
  addressSchema,
  checkoutInputSchema,
  contactInputSchema,
  createProductInputSchema,
  forgotPasswordInputSchema,
  loginInputSchema,
  registerInputSchema,
  resetPasswordInputSchema,
} from './schemas.js';

const validProduct = {
  name: 'Charizard ex',
  description: 'NM single from 151.',
  category: 'single-card' as const,
  set: '151' as const,
  series: 'Scarlet & Violet' as const,
  price: 4999,
  stock: 3,
  accent: '#a855f7',
  images: ['products/test.jpg'],
  rarity: 'ultra-rare' as const,
  condition: 'near-mint' as const,
  language: 'english' as const,
  releaseDate: '2024-01-01',
};

describe('registerInputSchema', () => {
  it('accepts a valid email and lowercases it', () => {
    const parsed = registerInputSchema.parse({
      email: 'Ash@Pallet.Town',
    });
    expect(parsed.email).toBe('ash@pallet.town');
  });

  it('rejects invalid emails', () => {
    expect(registerInputSchema.safeParse({ email: 'nope' }).success).toBe(false);
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

describe('forgotPasswordInputSchema', () => {
  it('accepts a valid email', () => {
    expect(forgotPasswordInputSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(forgotPasswordInputSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });
});

describe('resetPasswordInputSchema', () => {
  it('requires token and a long enough password', () => {
    expect(
      resetPasswordInputSchema.safeParse({ token: 'abc', password: 'short' }).success,
    ).toBe(false);
    expect(
      resetPasswordInputSchema.safeParse({ token: 'abc', password: 'longenough' }).success,
    ).toBe(true);
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

describe('createProductInputSchema', () => {
  it('accepts a valid product', () => {
    expect(createProductInputSchema.safeParse(validProduct).success).toBe(true);
  });

  it('requires at least one image', () => {
    expect(createProductInputSchema.safeParse({ ...validProduct, images: [] }).success).toBe(false);
  });

  it('rejects zero stock', () => {
    expect(createProductInputSchema.safeParse({ ...validProduct, stock: 0 }).success).toBe(false);
  });

  it('requires rarity and condition', () => {
    expect(
      createProductInputSchema.safeParse({ ...validProduct, rarity: undefined }).success,
    ).toBe(false);
    expect(
      createProductInputSchema.safeParse({ ...validProduct, condition: undefined }).success,
    ).toBe(false);
  });

  it('enforces name and description length limits', () => {
    expect(
      createProductInputSchema.safeParse({ ...validProduct, name: 'a'.repeat(51) }).success,
    ).toBe(false);
    expect(
      createProductInputSchema.safeParse({ ...validProduct, description: 'a'.repeat(1501) }).success,
    ).toBe(false);
  });

  it('accepts plain or fraction card numbers', () => {
    expect(
      createProductInputSchema.safeParse({ ...validProduct, cardNumber: '208' }).success,
    ).toBe(true);
    expect(
      createProductInputSchema.safeParse({ ...validProduct, cardNumber: '208/325' }).success,
    ).toBe(true);
    expect(
      createProductInputSchema.safeParse({ ...validProduct, cardNumber: '208/' }).success,
    ).toBe(false);
  });
});
