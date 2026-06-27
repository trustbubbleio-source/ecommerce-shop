import {
  PRODUCTS,
  PRODUCT_CATEGORIES,
  PRODUCT_SERIES,
  type Product,
  type ProductFilter,
  type SortKey,
  getProductById,
  getProductBySlug,
  queryProducts,
} from '@akknerds/shared';

export interface ListOptions {
  filter?: ProductFilter;
  sort?: SortKey;
  featured?: boolean;
  isNew?: boolean;
  limit?: number;
}

export interface CatalogMeta {
  categories: { value: string; count: number }[];
  series: string[];
  priceRange: { min: number; max: number };
}

/**
 * Read-only access to the product catalog. Backed by the shared in-memory
 * catalog today; swap this single class for a DB-backed implementation to go
 * to production without touching the routes.
 */
export class ProductRepository {
  constructor(private readonly products: Product[] = PRODUCTS) {}

  list(options: ListOptions = {}): Product[] {
    let result = queryProducts(this.products, { filter: options.filter, sort: options.sort });
    if (options.featured !== undefined) {
      result = result.filter((p) => p.featured === options.featured);
    }
    if (options.isNew !== undefined) {
      result = result.filter((p) => p.isNew === options.isNew);
    }
    if (typeof options.limit === 'number') {
      result = result.slice(0, Math.max(0, options.limit));
    }
    return result;
  }

  getByIdOrSlug(idOrSlug: string): Product | undefined {
    return getProductById(idOrSlug) ?? getProductBySlug(idOrSlug);
  }

  meta(): CatalogMeta {
    const categories = PRODUCT_CATEGORIES.map((value) => ({
      value,
      count: this.products.filter((p) => p.category === value).length,
    })).filter((c) => c.count > 0);

    const prices = this.products.map((p) => p.price);
    return {
      categories,
      series: PRODUCT_SERIES,
      priceRange: {
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0,
      },
    };
  }
}
