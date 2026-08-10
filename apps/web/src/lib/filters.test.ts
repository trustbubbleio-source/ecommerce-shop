import { describe, expect, it } from 'vitest';
import {
  DEFAULT_FILTERS,
  filtersToParams,
  isDefaultFilters,
  parseFilters,
  toProductsQuery,
} from './filters';

describe('parseFilters', () => {
  it('returns defaults for empty params', () => {
    expect(parseFilters(new URLSearchParams())).toEqual(DEFAULT_FILTERS);
  });

  it('parses valid params', () => {
    const params = new URLSearchParams(
      'category=booster-box&series=151&search=x&inStock=true&sort=price-asc',
    );
    expect(parseFilters(params)).toEqual({
      category: 'booster-box',
      series: '151',
      search: 'x',
      inStock: true,
      language: '',
      condition: '',
      sort: 'price-asc',
    });
  });

  it('ignores invalid category and sort values', () => {
    const params = new URLSearchParams('category=bogus&sort=bogus');
    const result = parseFilters(params);
    expect(result.category).toBe('all');
    expect(result.sort).toBe('featured');
  });
});

describe('filtersToParams', () => {
  it('omits default values', () => {
    expect(filtersToParams(DEFAULT_FILTERS).toString()).toBe('');
  });

  it('serializes non-default values', () => {
    const params = filtersToParams({
      category: 'single-card',
      series: '151',
      search: 'pikachu',
      inStock: true,
      language: 'japanese',
      condition: 'near-mint',
      sort: 'rating',
    });
    expect(params.get('category')).toBe('single-card');
    expect(params.get('series')).toBe('151');
    expect(params.get('search')).toBe('pikachu');
    expect(params.get('inStock')).toBe('true');
    expect(params.get('language')).toBe('japanese');
    expect(params.get('condition')).toBe('near-mint');
    expect(params.get('sort')).toBe('rating');
  });

  it('round-trips through parse', () => {
    const filters = {
      category: 'bundle' as const,
      series: 'One More Rip Exclusive',
      search: '',
      inStock: true,
      language: 'english' as const,
      condition: '' as const,
      sort: 'newest' as const,
    };
    expect(parseFilters(filtersToParams(filters))).toEqual(filters);
  });
});

describe('toProductsQuery', () => {
  it('maps filters to an api query, dropping falsy optionals', () => {
    expect(toProductsQuery(DEFAULT_FILTERS)).toEqual({
      category: 'all',
      series: undefined,
      search: undefined,
      inStock: undefined,
      language: undefined,
      condition: undefined,
      sort: 'featured',
    });
  });
});

describe('isDefaultFilters', () => {
  it('detects the default state', () => {
    expect(isDefaultFilters(DEFAULT_FILTERS)).toBe(true);
    expect(isDefaultFilters({ ...DEFAULT_FILTERS, inStock: true })).toBe(false);
  });
});
