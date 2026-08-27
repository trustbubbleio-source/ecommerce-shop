import type {
  CardCondition,
  Product,
  ProductCategory,
  ProductLanguage,
  SortKey,
} from '@akknerds/shared';

export interface CatalogMeta {
  categories: { value: ProductCategory; count: number }[];
  series: readonly string[];
  sets: readonly string[];
  priceRange: { min: number; max: number };
}

export interface ProductsQuery {
  category?: ProductCategory | 'all';
  series?: string;
  search?: string;
  sort?: SortKey;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  language?: ProductLanguage;
  condition?: CardCondition;
  featured?: boolean;
  isNew?: boolean;
  limit?: number;
  offset?: number;
}

export interface ProductsListResponse {
  products: Product[];
  total: number;
  limit?: number | null;
  offset?: number;
  hasMore?: boolean;
}

/** Default page size for the shop catalogue (mobile-friendly grid batches). */
export const SHOP_PAGE_SIZE = 24;

/** Admin products table page size. */
export const ADMIN_PRODUCTS_PAGE_SIZE = 10;

export type AdminProductSortKey = 'name' | 'category' | 'price' | 'stock' | 'status';

export interface AdminProductsQuery {
  search?: string;
  limit?: number;
  offset?: number;
  sortKey?: AdminProductSortKey;
  sortDir?: 'asc' | 'desc';
}

export interface ApiClientConfig {
  /** Origin only, e.g. `http://localhost:4000` — `/api` is appended. */
  baseUrl: string;
  /** Optional override; defaults to global `fetch`. */
  fetch?: typeof fetch;
}
