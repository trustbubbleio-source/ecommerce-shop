import { describe, expect, it } from 'vitest';
import { computeCatalogStats } from './catalog-stats.js';
import type { Product } from './types.js';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'prod_1',
    slug: 'test',
    name: 'Test',
    description: 'Test',
    category: 'single-card',
    set: '151',
    series: 'Scarlet & Violet',
    price: 1000,
    currency: 'eur',
    images: [],
    image: undefined,
    accent: '#a855f7',
    stock: 2,
    featured: false,
    isNew: false,
    rating: 0,
    reviewCount: 0,
    tags: [],
    language: 'english',
    releaseDate: '2024-01-01',
    ...overrides,
  };
}

describe('computeCatalogStats', () => {
  it('sums listings, units and inventory value (price × stock in cents)', () => {
    const stats = computeCatalogStats([
      makeProduct({ id: 'a', price: 2500, stock: 3 }),
      makeProduct({ id: 'b', price: 1000, stock: 1 }),
    ]);
    expect(stats).toEqual({
      listings: 2,
      unitsInStock: 4,
      inventoryValueCents: 2500 * 3 + 1000 * 1,
    });
  });

  it('ignores negative stock when valuing inventory', () => {
    const stats = computeCatalogStats([makeProduct({ price: 500, stock: -2 })]);
    expect(stats).toEqual({
      listings: 1,
      unitsInStock: 0,
      inventoryValueCents: 0,
    });
  });

  it('returns zeros for an empty catalog', () => {
    expect(computeCatalogStats([])).toEqual({
      listings: 0,
      unitsInStock: 0,
      inventoryValueCents: 0,
    });
  });
});
