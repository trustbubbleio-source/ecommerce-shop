import { prisma } from '@akknerds/db';
import type { ProductReview } from '@akknerds/shared';
import type {
  CreateReviewInput,
  ProductReviewRepository,
} from '../interfaces.js';

function toPublic(row: {
  id: string;
  productId: string;
  rating: number;
  body: string;
  createdAt: Date;
  user: { id: string; name: string };
}): ProductReview {
  return {
    id: row.id,
    productId: row.productId,
    rating: row.rating,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    author: {
      id: row.user.id,
      name: row.user.name,
    },
  };
}

export class PrismaProductReviewRepository implements ProductReviewRepository {
  async listByProduct(productId: string): Promise<ProductReview[]> {
    const rows = await prisma.productReview.findMany({
      where: { productId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toPublic);
  }

  async findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<ProductReview | undefined> {
    const row = await prisma.productReview.findUnique({
      where: { userId_productId: { userId, productId } },
      include: { user: { select: { id: true, name: true } } },
    });
    return row ? toPublic(row) : undefined;
  }

  async create(input: CreateReviewInput): Promise<ProductReview> {
    const row = await prisma.productReview.create({
      data: {
        userId: input.userId,
        productId: input.productId,
        rating: input.rating,
        body: input.body,
      },
      include: { user: { select: { id: true, name: true } } },
    });
    return toPublic(row);
  }

  async listRatings(productId: string): Promise<number[]> {
    const rows = await prisma.productReview.findMany({
      where: { productId },
      select: { rating: true },
    });
    return rows.map((r) => r.rating);
  }
}
