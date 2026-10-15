import { fromPrismaCategory, fromProduct, prisma, toProduct } from '@akknerds/db';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_SERIES,
  PRODUCT_SETS,
  computeCatalogStats,
  type CreateProductInput,
  type Product,
} from '@akknerds/shared';
import { newProductFromInput, applyProductInput } from '../../lib/product-factory.js';
import type {
  CatalogMeta,
  ListOptions,
  ProductPage,
  ProductRepository,
  ReserveStockResult,
  StockAdjustment,
} from '../interfaces.js';
import { pageProducts } from '../product-page.js';
import {
  needsInMemoryProductPage,
  toProductOrderBy,
  toProductWhere,
} from './product-query.js';

export class PrismaProductRepository implements ProductRepository {
  private async loadProducts(): Promise<Product[]> {
    const rows = await prisma.product.findMany();
    return rows.map(toProduct);
  }

  /**
   * IDs matching the shared search haystack (name/set/series/artist/tags/id/card#).
   * Returns `null` when there is no search term.
   */
  private async searchProductIds(search: string | undefined): Promise<string[] | null> {
    const q = search?.trim();
    if (!q) return null;
    const pattern = `%${q}%`;
    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM products
      WHERE name ILIKE ${pattern}
         OR slug ILIKE ${pattern}
         OR id ILIKE ${pattern}
         OR COALESCE(artist, '') ILIKE ${pattern}
         OR COALESCE(card_number, '') ILIKE ${pattern}
         OR description ILIKE ${pattern}
         OR set_name::text ILIKE ${pattern}
         OR series::text ILIKE ${pattern}
         OR array_to_string(tags, ' ') ILIKE ${pattern}
    `;
    return rows.map((row) => row.id);
  }

  async listPage(options: ListOptions = {}): Promise<ProductPage> {
    // Admin "status" sort is a composite key — keep shared in-memory behaviour.
    if (needsInMemoryProductPage(options)) {
      return pageProducts(await this.loadProducts(), options);
    }

    const searchIds = await this.searchProductIds(options.filter?.search);
    if (searchIds && searchIds.length === 0) {
      return { products: [], total: 0 };
    }

    const where = toProductWhere(options, searchIds);
    const orderBy = toProductOrderBy(options);
    const offset = Math.max(0, options.offset ?? 0);
    const take = typeof options.limit === 'number' ? Math.max(0, options.limit) : undefined;

    const [total, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip: offset,
        ...(take !== undefined ? { take } : {}),
      }),
    ]);

    return { products: rows.map(toProduct), total };
  }

  async list(options: ListOptions = {}): Promise<Product[]> {
    const { products } = await this.listPage(options);
    return products;
  }

  async getByIdOrSlug(idOrSlug: string): Promise<Product | undefined> {
    const row = await prisma.product.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    });
    return row ? toProduct(row) : undefined;
  }

  async catalogStats() {
    const rows = await prisma.$queryRaw<
      Array<{ listings: bigint; units: bigint; value: bigint }>
    >`
      SELECT
        COUNT(*)::bigint AS listings,
        COALESCE(SUM(GREATEST(stock, 0)), 0)::bigint AS units,
        COALESCE(SUM(price * GREATEST(stock, 0)), 0)::bigint AS value
      FROM products
    `;
    const row = rows[0];
    if (!row) return computeCatalogStats([]);
    return {
      listings: Number(row.listings),
      unitsInStock: Number(row.units),
      inventoryValueCents: Number(row.value),
    };
  }

  async meta(): Promise<CatalogMeta> {
    const [grouped, priceAgg] = await Promise.all([
      prisma.product.groupBy({
        by: ['category'],
        _count: { _all: true },
      }),
      prisma.product.aggregate({
        _min: { price: true },
        _max: { price: true },
      }),
    ]);
    // groupBy returns Prisma enum keys (booster_box); shop meta needs domain kebab-case.
    const countByCategory = new Map(
      grouped.map((row) => [fromPrismaCategory(row.category), row._count._all]),
    );
    const categories = PRODUCT_CATEGORIES.map((value) => ({
      value,
      count: countByCategory.get(value) ?? 0,
    })).filter((c) => c.count > 0);

    return {
      categories,
      series: PRODUCT_SERIES,
      sets: PRODUCT_SETS,
      priceRange: {
        min: priceAgg._min.price ?? 0,
        max: priceAgg._max.price ?? 0,
      },
    };
  }

  async create(input: CreateProductInput): Promise<Product> {
    const product = newProductFromInput(input);
    const row = await prisma.product.create({ data: fromProduct(product) });
    return toProduct(row);
  }

  async update(id: string, input: CreateProductInput): Promise<Product | undefined> {
    const existing = await this.getByIdOrSlug(id);
    if (!existing) return undefined;
    const product = applyProductInput(existing, input);
    const row = await prisma.product.update({ where: { id: existing.id }, data: fromProduct(product) });
    return toProduct(row);
  }

  async setRatingStats(
    productId: string,
    stats: { rating: number; reviewCount: number },
  ): Promise<Product | undefined> {
    const row = await prisma.product.update({
      where: { id: productId },
      data: { rating: stats.rating, reviewCount: stats.reviewCount },
    });
    return toProduct(row);
  }

  async reserveStock(lines: StockAdjustment[]): Promise<ReserveStockResult> {
    if (lines.length === 0) return { ok: true };
    try {
      await prisma.$transaction(async (tx) => {
        for (const line of lines) {
          const result = await tx.product.updateMany({
            where: { id: line.productId, stock: { gte: line.quantity } },
            data: { stock: { decrement: line.quantity } },
          });
          if (result.count !== 1) {
            throw new Error(`INSUFFICIENT:${line.productId}`);
          }
        }
      });
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      if (message.startsWith('INSUFFICIENT:')) {
        return { ok: false, productId: message.slice('INSUFFICIENT:'.length) };
      }
      throw error;
    }
  }

  async releaseStock(lines: StockAdjustment[]): Promise<void> {
    if (lines.length === 0) return;
    await prisma.$transaction(async (tx) => {
      for (const line of lines) {
        await tx.product.updateMany({
          where: { id: line.productId },
          data: { stock: { increment: line.quantity } },
        });
      }
    });
  }
}
