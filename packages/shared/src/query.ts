import type { CardCondition, Product, ProductCategory, ProductLanguage } from './types.js';

export type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name-asc' | 'rating';

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'rating', label: 'Top Rated' },
];

export interface ProductFilter {
  category?: ProductCategory | 'all';
  series?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  language?: ProductLanguage;
  condition?: CardCondition;
}

export interface ProductQuery {
  filter?: ProductFilter;
  sort?: SortKey;
}

function matches(product: Product, filter: ProductFilter): boolean {
  if (filter.category && filter.category !== 'all' && product.category !== filter.category) {
    return false;
  }
  if (filter.series && product.series !== filter.series) return false;
  if (filter.inStockOnly && product.stock <= 0) return false;
  if (filter.language && product.language !== filter.language) return false;
  if (filter.condition && product.condition !== filter.condition) return false;
  if (typeof filter.minPrice === 'number' && product.price < filter.minPrice) return false;
  if (typeof filter.maxPrice === 'number' && product.price > filter.maxPrice) return false;
  if (filter.search) {
    const haystack =
      `${product.name} ${product.set} ${product.series} ${product.artist ?? ''} ${product.tags.join(' ')} ${product.id} ${product.cardNumber ?? ''}`.toLowerCase();
    if (!haystack.includes(filter.search.trim().toLowerCase())) return false;
  }
  return true;
}

const SORTERS: Record<SortKey, (a: Product, b: Product) => number> = {
  featured: (a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating,
  newest: (a, b) => b.releaseDate.localeCompare(a.releaseDate),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  'name-asc': (a, b) => a.name.localeCompare(b.name),
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
};

/** Pure, deterministic filter + sort used by both the API and the client. */
export function queryProducts(products: Product[], query: ProductQuery = {}): Product[] {
  const filter = query.filter ?? {};
  const result = products.filter((p) => matches(p, filter));
  result.sort(SORTERS[query.sort ?? 'featured']);
  return result;
}
