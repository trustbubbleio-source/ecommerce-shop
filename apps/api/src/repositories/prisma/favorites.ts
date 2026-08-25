import { prisma, toProduct } from '@akknerds/db';
import type { Product } from '@akknerds/shared';
import type { FavoriteRepository } from '../interfaces.js';

export class PrismaFavoriteRepository implements FavoriteRepository {
  async listProductIds(userId: string): Promise<string[]> {
    const rows = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { productId: true },
    });
    return rows.map((row) => row.productId);
  }

  async listProducts(userId: string): Promise<Product[]> {
    const rows = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    });
    return rows.map((row) => toProduct(row.product));
  }

  async has(userId: string, productId: string): Promise<boolean> {
    const row = await prisma.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { id: true },
    });
    return Boolean(row);
  }

  async add(userId: string, productId: string): Promise<boolean> {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) return false;
    try {
      await prisma.favorite.create({
        data: { userId, productId },
      });
      return true;
    } catch {
      // Unique violation — already favorited.
      return true;
    }
  }

  async remove(userId: string, productId: string): Promise<boolean> {
    try {
      await prisma.favorite.delete({
        where: { userId_productId: { userId, productId } },
      });
      return true;
    } catch {
      return false;
    }
  }
}
