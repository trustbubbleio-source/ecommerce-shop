import type { Product } from '@akknerds/shared';
import type { FavoriteRepository as IFavoriteRepository, ProductRepository } from './interfaces.js';

/** In-memory favorites store, isolated per app instance. */
export class FavoriteRepository implements IFavoriteRepository {
  /** userId → set of productIds (insertion order preserved via Map). */
  private readonly byUser = new Map<string, Map<string, true>>();

  constructor(private readonly products: ProductRepository) {}

  private bucket(userId: string): Map<string, true> {
    let set = this.byUser.get(userId);
    if (!set) {
      set = new Map();
      this.byUser.set(userId, set);
    }
    return set;
  }

  async listProductIds(userId: string): Promise<string[]> {
    return [...this.bucket(userId).keys()].reverse();
  }

  async listProducts(userId: string): Promise<Product[]> {
    const ids = await this.listProductIds(userId);
    const products: Product[] = [];
    for (const id of ids) {
      const product = await this.products.getByIdOrSlug(id);
      if (product) products.push(product);
    }
    return products;
  }

  async has(userId: string, productId: string): Promise<boolean> {
    return this.bucket(userId).has(productId);
  }

  async add(userId: string, productId: string): Promise<boolean> {
    const product = await this.products.getByIdOrSlug(productId);
    if (!product) return false;
    this.bucket(userId).set(product.id, true);
    return true;
  }

  async remove(userId: string, productId: string): Promise<boolean> {
    return this.bucket(userId).delete(productId);
  }
}
