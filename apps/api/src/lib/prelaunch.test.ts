import { describe, expect, it } from 'vitest';
import { canPurchase } from './prelaunch.js';

describe('canPurchase', () => {
  it('blocks guests and customers when locked', () => {
    expect(canPurchase(undefined, { locked: true, isTest: false })).toBe(false);
    expect(canPurchase('customer', { locked: true, isTest: false })).toBe(false);
  });

  it('allows admins when locked', () => {
    expect(canPurchase('admin', { locked: true, isTest: false })).toBe(true);
  });

  it('allows everyone after launch or in tests', () => {
    expect(canPurchase(undefined, { locked: false, isTest: false })).toBe(true);
    expect(canPurchase('customer', { locked: true, isTest: true })).toBe(true);
  });
});
