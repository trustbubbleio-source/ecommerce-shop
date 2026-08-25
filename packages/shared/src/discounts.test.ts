import { describe, expect, it } from 'vitest';
import { applyDiscountCode, findDiscountCode, normalizeDiscountCode } from './discounts.js';

describe('normalizeDiscountCode', () => {
  it('trims and uppercases', () => {
    expect(normalizeDiscountCode('  onemorerip10 ')).toBe('ONEMORERIP10');
  });
});

describe('findDiscountCode', () => {
  it('finds known codes case-insensitively', () => {
    expect(findDiscountCode('rip5')?.code).toBe('RIP5');
  });

  it('returns undefined for unknown codes', () => {
    expect(findDiscountCode('NOPE')).toBeUndefined();
  });
});

describe('applyDiscountCode', () => {
  it('applies percent off the subtotal', () => {
    const applied = applyDiscountCode(10_000, 599, 'ONEMORERIP10');
    expect(applied).toMatchObject({ amount: 1000, shipping: 599, code: 'ONEMORERIP10' });
  });

  it('caps fixed discounts at the subtotal', () => {
    expect(applyDiscountCode(300, 599, 'RIP5')?.amount).toBe(300);
  });

  it('grants free shipping', () => {
    expect(applyDiscountCode(2000, 599, 'FREESHIP')).toMatchObject({
      amount: 0,
      shipping: 0,
    });
  });

  it('ignores empty carts', () => {
    expect(applyDiscountCode(0, 0, 'ONEMORERIP10')).toBeNull();
  });

  it('skips first-order codes after a completed purchase', () => {
    expect(
      applyDiscountCode(10_000, 599, 'ONEMORERIP10', { hasCompletedOrder: true }),
    ).toBeNull();
  });
});
