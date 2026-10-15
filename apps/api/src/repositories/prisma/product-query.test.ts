import { describe, expect, it } from 'vitest';
import { needsInMemoryProductPage, toProductOrderBy, toProductWhere } from './product-query.js';

describe('toProductWhere', () => {
  it('maps shop filters into Prisma AND clauses', () => {
    const where = toProductWhere({
      filter: {
        category: 'booster-box',
        series: 'Scarlet & Violet',
        minPrice: 1000,
        maxPrice: 20000,
        inStockOnly: true,
        language: 'english',
      },
      featured: true,
      isNew: false,
    });
    expect(where).toEqual({
      AND: [
        { category: 'booster_box' },
        { series: 'scarlet_and_violet' },
        { stock: { gt: 0 } },
        { language: 'english' },
        { price: { gte: 1000, lte: 20000 } },
        { featured: true },
        { isNew: false },
      ],
    });
  });

  it('restricts to search ids when provided', () => {
    expect(toProductWhere({ filter: { search: '151' } }, ['bb-151'])).toEqual({
      AND: [{ id: { in: ['bb-151'] } }],
    });
  });
});

describe('toProductOrderBy', () => {
  it('orders featured then rating for the default shop sort', () => {
    expect(toProductOrderBy({})).toEqual([
      { featured: 'desc' },
      { rating: 'desc' },
      { name: 'asc' },
    ]);
  });

  it('orders by admin stock descending', () => {
    expect(toProductOrderBy({ adminSort: { key: 'stock', dir: 'desc' } })).toEqual([
      { stock: 'desc' },
      { name: 'asc' },
    ]);
  });
});

describe('needsInMemoryProductPage', () => {
  it('is true only for admin status sort', () => {
    expect(needsInMemoryProductPage({ adminSort: { key: 'status', dir: 'asc' } })).toBe(true);
    expect(needsInMemoryProductPage({ adminSort: { key: 'name', dir: 'asc' } })).toBe(false);
    expect(needsInMemoryProductPage({ sort: 'price-asc' })).toBe(false);
  });
});
