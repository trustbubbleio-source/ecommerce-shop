import { describe, expect, it } from 'vitest';
import { buildProductUrl, productPath } from './url.js';

describe('productPath', () => {
  it('builds a product path from a slug', () => {
    expect(productPath('charizard-ex')).toBe('/product/charizard-ex');
  });

  it('trims and strips leading slashes', () => {
    expect(productPath('  /mega-box  ')).toBe('/product/mega-box');
  });

  it('rejects empty slugs', () => {
    expect(() => productPath('')).toThrow(/slug/i);
    expect(() => productPath('   ')).toThrow(/slug/i);
  });
});

describe('buildProductUrl', () => {
  it('joins origin and product path without double slashes', () => {
    expect(buildProductUrl('https://www.onemorerip.cards/', '151-booster-box')).toBe(
      'https://www.onemorerip.cards/product/151-booster-box',
    );
  });

  it('rejects missing base URL', () => {
    expect(() => buildProductUrl('', 'x')).toThrow(/base url/i);
  });
});
