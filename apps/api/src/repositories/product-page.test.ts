import { PRODUCTS } from '@akknerds/shared';
import { describe, expect, it } from 'vitest';
import { pageProducts } from './product-page.js';

describe('pageProducts', () => {
  it('pages after filtering by search', () => {
    const first = pageProducts(PRODUCTS, {
      filter: { search: '151' },
      adminSort: { key: 'name', dir: 'asc' },
      limit: 2,
      offset: 0,
    });
    expect(first.total).toBeGreaterThan(2);
    expect(first.products).toHaveLength(2);

    const second = pageProducts(PRODUCTS, {
      filter: { search: '151' },
      adminSort: { key: 'name', dir: 'asc' },
      limit: 2,
      offset: 2,
    });
    expect(second.products[0]?.id).not.toBe(first.products[0]?.id);
  });

  it('sorts by stock descending for the admin table', () => {
    const page = pageProducts(PRODUCTS, {
      adminSort: { key: 'stock', dir: 'desc' },
      limit: 5,
    });
    const stocks = page.products.map((p) => p.stock);
    expect(stocks).toEqual([...stocks].sort((a, b) => b - a));
  });
});
