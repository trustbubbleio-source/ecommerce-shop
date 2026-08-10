import { fromProduct, prisma, toProduct } from '@akknerds/db';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_SERIES,
  PRODUCT_SETS,
  computeCatalogStats,
  type CreateProductInput,
  type Product,
} from '@akknerds/shared';
import { newProductFromInput, applyProductInput } from '../../lib/product-factory.js';
import type { CatalogMeta, ListOptions, ProductPage, ProductRepository } from '../interfaces.js';
import { pageProducts } from '../product-page.js';

export class PrismaProductRepository implements ProductRepository {
  private async loadProducts(): Promise<Product[]> {
    const rows = await prisma.product.findMany();
    return rows.map(toProduct);
  }

  async listPage(options: ListOptions = {}): Promise<ProductPage> {
    return pageProducts(await this.loadProducts(), options);
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
    return computeCatalogStats(await this.loadProducts());
  }

  async meta(): Promise<CatalogMeta> {
    const products = await this.loadProducts();
    const categories = PRODUCT_CATEGORIES.map((value) => ({
      value,
      count: products.filter((p) => p.category === value).length,
    })).filter((c) => c.count > 0);

    const prices = products.map((p) => p.price);
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
}
