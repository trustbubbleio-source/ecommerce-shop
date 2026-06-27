import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
  SORT_OPTIONS,
  type SortKey,
} from '@akknerds/shared';
import type { ProductsQuery } from './api';

export interface ProductFilters {
  category: ProductCategory | 'all';
  series: string;
  search: string;
  inStock: boolean;
  sort: SortKey;
}

export const DEFAULT_FILTERS: ProductFilters = {
  category: 'all',
  series: '',
  search: '',
  inStock: false,
  sort: 'featured',
};

const VALID_SORTS = new Set<string>(SORT_OPTIONS.map((o) => o.value));
const VALID_CATEGORIES = new Set<string>(PRODUCT_CATEGORIES);

export function parseFilters(params: URLSearchParams): ProductFilters {
  const category = params.get('category');
  const sort = params.get('sort');
  return {
    category: category && VALID_CATEGORIES.has(category) ? (category as ProductCategory) : 'all',
    series: params.get('series') ?? '',
    search: params.get('search') ?? '',
    inStock: params.get('inStock') === 'true',
    sort: sort && VALID_SORTS.has(sort) ? (sort as SortKey) : 'featured',
  };
}

/** Serialize to URL params, omitting defaults to keep URLs clean and shareable. */
export function filtersToParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.category !== 'all') params.set('category', filters.category);
  if (filters.series) params.set('series', filters.series);
  if (filters.search) params.set('search', filters.search);
  if (filters.inStock) params.set('inStock', 'true');
  if (filters.sort !== 'featured') params.set('sort', filters.sort);
  return params;
}

export function toProductsQuery(filters: ProductFilters): ProductsQuery {
  return {
    category: filters.category,
    series: filters.series || undefined,
    search: filters.search || undefined,
    inStock: filters.inStock || undefined,
    sort: filters.sort,
  };
}

export function isDefaultFilters(filters: ProductFilters): boolean {
  return (
    filters.category === 'all' &&
    filters.series === '' &&
    filters.search === '' &&
    !filters.inStock &&
    filters.sort === 'featured'
  );
}
