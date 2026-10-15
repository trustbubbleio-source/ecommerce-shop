import {
  PRODUCTS,
  PRODUCT_CATEGORIES,
  PRODUCT_SERIES,
  PRODUCT_SETS,
  computeCatalogStats,
  type CreateProductInput,
  type Product,
} from '@akknerds/shared';
import { newProductFromInput, applyProductInput } from '../lib/product-factory.js';
import type {
  CatalogMeta,
  ListOptions,
  ProductPage,
  ProductRepository as IProductRepository,
  ReserveStockResult,
  StockAdjustment,
} from './interfaces.js';
import { pageProducts } from './product-page.js';

export type { CatalogMeta, ListOptions };

/**
 * In-memory product catalog. Used when DATABASE_URL is not configured.
 */
export class ProductRepository implements IProductRepository {
  private readonly products: Product[];

  constructor(seed: Product[] = PRODUCTS) {
    // Deep-ish clone so stock mutations in tests / checkout never leak into PRODUCTS.
    this.products = seed.map((product) => ({
      ...product,
      images: [...product.images],
      tags: [...product.tags],
    }));
  }

  async listPage(options: ListOptions = {}): Promise<ProductPage> {
    return pageProducts(this.products, options);
  }

  async list(options: ListOptions = {}): Promise<Product[]> {
    const { products } = await this.listPage(options);
    return products;
  }

  async getByIdOrSlug(idOrSlug: string): Promise<Product | undefined> {
    return this.products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
  }

  async catalogStats() {
    return computeCatalogStats(this.products);
  }

  async meta(): Promise<CatalogMeta> {
    const categories = PRODUCT_CATEGORIES.map((value) => ({
      value,
      count: this.products.filter((p) => p.category === value).length,
    })).filter((c) => c.count > 0);

    const prices = this.products.map((p) => p.price);
    return {
      categories,
      series: PRODUCT_SERIES,
      sets: PRODUCT_SETS,
      priceRange: {
        min: prices.length ? Math.min(...prices) : 0,
        max: prices.length ? Math.max(...prices) : 0,
      },
    };
  }

  async create(input: CreateProductInput): Promise<Product> {
    const product = newProductFromInput(input);
    this.products.push(product);
    return product;
  }

  async update(id: string, input: CreateProductInput): Promise<Product | undefined> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return undefined;
    const updated = applyProductInput(this.products[index]!, input);
    this.products[index] = updated;
    return updated;
  }

  async setRatingStats(
    productId: string,
    stats: { rating: number; reviewCount: number },
  ): Promise<Product | undefined> {
    const product = this.products.find((p) => p.id === productId);
    if (!product) return undefined;
    product.rating = stats.rating;
    product.reviewCount = stats.reviewCount;
    return product;
  }

  async reserveStock(lines: StockAdjustment[]): Promise<ReserveStockResult> {
    for (const line of lines) {
      const product = this.products.find((p) => p.id === line.productId);
      if (!product || product.stock < line.quantity) {
        return { ok: false, productId: line.productId };
      }
    }
    for (const line of lines) {
      const product = this.products.find((p) => p.id === line.productId)!;
      product.stock -= line.quantity;
    }
    return { ok: true };
  }

  async releaseStock(lines: StockAdjustment[]): Promise<void> {
    for (const line of lines) {
      const product = this.products.find((p) => p.id === line.productId);
      if (product) product.stock += line.quantity;
    }
  }
}
