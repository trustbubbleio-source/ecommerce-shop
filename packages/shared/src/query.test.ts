import { describe, expect, it } from 'vitest';
import { PRODUCTS } from './catalog.js';
import { queryProducts, SORT_OPTIONS } from './query.js';

describe('queryProducts', () => {
  it('returns all products with no query', () => {
    expect(queryProducts(PRODUCTS)).toHaveLength(PRODUCTS.length);
  });

  it('filters by category', () => {
    const result = queryProducts(PRODUCTS, { filter: { category: 'booster-box' } });
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((p) => p.category === 'booster-box')).toBe(true);
  });

  it("treats category 'all' as no category filter", () => {
    expect(queryProducts(PRODUCTS, { filter: { category: 'all' } })).toHaveLength(PRODUCTS.length);
  });

  it('filters by series', () => {
    const result = queryProducts(PRODUCTS, { filter: { series: 'Sword & Shield' } });
    expect(result.every((p) => p.series === 'Sword & Shield')).toBe(true);
  });

  it('filters by search across name, set, series, artist, tags, id and card number', () => {
    expect(queryProducts(PRODUCTS, { filter: { search: 'charizard' } }).length).toBeGreaterThan(0);
    expect(queryProducts(PRODUCTS, { filter: { search: 'CHARIZARD' } }).length).toBeGreaterThan(0);
    expect(queryProducts(PRODUCTS, { filter: { search: 'zzz-no-match' } })).toHaveLength(0);
    expect(queryProducts(PRODUCTS, { filter: { search: 'bb-151' } }).some((p) => p.id === 'bb-151')).toBe(
      true,
    );

    const withArtist = PRODUCTS.map((p, i) =>
      i === 0 ? { ...p, artist: 'Mitsuhiro Arita' } : p,
    );
    expect(queryProducts(withArtist, { filter: { search: 'arita' } })).toHaveLength(1);
  });

  it('filters by price range', () => {
    const result = queryProducts(PRODUCTS, { filter: { minPrice: 1000, maxPrice: 6000 } });
    expect(result.every((p) => p.price >= 1000 && p.price <= 6000)).toBe(true);
  });

  it('filters in-stock only', () => {
    const withZero = [...PRODUCTS, { ...PRODUCTS[0]!, id: 'oos', stock: 0 }];
    const result = queryProducts(withZero, { filter: { inStockOnly: true } });
    expect(result.every((p) => p.stock > 0)).toBe(true);
  });

  it('filters by language and condition', () => {
    const singles = PRODUCTS.filter((p) => p.category === 'single-card');
    if (singles.length === 0) return;
    const sample = singles[0]!;
    const withCondition = { ...sample, condition: 'near-mint' as const, language: 'english' as const };
    const catalog = [withCondition];
    expect(
      queryProducts(catalog, { filter: { language: 'english', condition: 'near-mint' } }),
    ).toHaveLength(1);
    expect(queryProducts(catalog, { filter: { language: 'japanese' } })).toHaveLength(0);
  });

  it('sorts by price ascending and descending', () => {
    const asc = queryProducts(PRODUCTS, { sort: 'price-asc' });
    const desc = queryProducts(PRODUCTS, { sort: 'price-desc' });
    expect(asc[0]!.price).toBeLessThanOrEqual(asc[asc.length - 1]!.price);
    expect(desc[0]!.price).toBeGreaterThanOrEqual(desc[desc.length - 1]!.price);
  });

  it('sorts by name ascending', () => {
    const result = queryProducts(PRODUCTS, { sort: 'name-asc' });
    expect(result[0]!.name.localeCompare(result[1]!.name)).toBeLessThanOrEqual(0);
  });

  it('sorts by newest using release date', () => {
    const result = queryProducts(PRODUCTS, { sort: 'newest' });
    expect(result[0]!.releaseDate >= result[result.length - 1]!.releaseDate).toBe(true);
  });

  it('sorts by rating', () => {
    const result = queryProducts(PRODUCTS, { sort: 'rating' });
    expect(result[0]!.rating).toBeGreaterThanOrEqual(result[result.length - 1]!.rating);
  });

  it('sorts featured first by default', () => {
    const result = queryProducts(PRODUCTS, { sort: 'featured' });
    const firstNonFeatured = result.findIndex((p) => !p.featured);
    const lastFeatured = result.map((p) => p.featured).lastIndexOf(true);
    expect(firstNonFeatured).toBeGreaterThan(lastFeatured - 1);
  });

  it('does not mutate the input array', () => {
    const input = [...PRODUCTS];
    const snapshot = input.map((p) => p.id);
    queryProducts(input, { sort: 'price-desc' });
    expect(input.map((p) => p.id)).toEqual(snapshot);
  });

  it('exposes sort options', () => {
    expect(SORT_OPTIONS.map((o) => o.value)).toContain('featured');
    expect(SORT_OPTIONS).toHaveLength(6);
  });
});
