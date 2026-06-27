import { describe, expect, it } from 'vitest';
import {
  getProductById,
  getProductBySlug,
  PRODUCTS,
  PRODUCT_CATEGORIES,
  PRODUCT_SERIES,
} from './catalog.js';

describe('catalog', () => {
  it('contains products', () => {
    expect(PRODUCTS.length).toBeGreaterThan(10);
  });

  it('has unique ids and slugs', () => {
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(PRODUCTS.length);
    expect(new Set(PRODUCTS.map((p) => p.slug)).size).toBe(PRODUCTS.length);
  });

  it('has valid prices and stock for every product', () => {
    for (const p of PRODUCTS) {
      expect(p.price).toBeGreaterThan(0);
      expect(Number.isInteger(p.price)).toBe(true);
      expect(p.stock).toBeGreaterThanOrEqual(0);
      expect(p.rating).toBeGreaterThanOrEqual(0);
      expect(p.rating).toBeLessThanOrEqual(5);
    }
  });

  it('only ever discounts below the original price', () => {
    for (const p of PRODUCTS) {
      if (p.compareAtPrice !== undefined) {
        expect(p.compareAtPrice).toBeGreaterThan(p.price);
      }
    }
  });

  it('has at least one featured product', () => {
    expect(PRODUCTS.some((p) => p.featured)).toBe(true);
  });

  it('looks up products by id', () => {
    expect(getProductById('bb-151')?.name).toContain('151');
    expect(getProductById('does-not-exist')).toBeUndefined();
  });

  it('looks up products by slug', () => {
    const product = PRODUCTS[0]!;
    expect(getProductBySlug(product.slug)?.id).toBe(product.id);
    expect(getProductBySlug('does-not-exist')).toBeUndefined();
  });

  it('derives categories and series lists', () => {
    expect(PRODUCT_CATEGORIES).toContain('booster-box');
    expect(PRODUCT_SERIES.length).toBeGreaterThan(1);
    // every product category is part of the known categories
    expect(PRODUCTS.every((p) => PRODUCT_CATEGORIES.includes(p.category))).toBe(true);
  });
});
