import type { ProductReview } from '@akknerds/shared';
import { nanoid } from 'nanoid';
import type {
  CreateReviewInput,
  ProductReviewRepository as IProductReviewRepository,
  UserRepository,
} from './interfaces.js';

interface StoredReview {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  body: string;
  createdAt: string;
}

/** In-memory product reviews, isolated per app instance. */
export class ProductReviewRepository implements IProductReviewRepository {
  private readonly reviews: StoredReview[] = [];

  constructor(private readonly users: UserRepository) {}

  private async toPublic(row: StoredReview): Promise<ProductReview> {
    const user = await this.users.findById(row.userId);
    return {
      id: row.id,
      productId: row.productId,
      rating: row.rating,
      body: row.body,
      createdAt: row.createdAt,
      author: {
        id: row.userId,
        name: user?.name ?? 'Member',
      },
    };
  }

  async listByProduct(productId: string): Promise<ProductReview[]> {
    const rows = this.reviews
      .filter((r) => r.productId === productId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return Promise.all(rows.map((row) => this.toPublic(row)));
  }

  async findByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<ProductReview | undefined> {
    const row = this.reviews.find((r) => r.userId === userId && r.productId === productId);
    return row ? this.toPublic(row) : undefined;
  }

  async create(input: CreateReviewInput): Promise<ProductReview> {
    const row: StoredReview = {
      id: `rev_${nanoid(16)}`,
      userId: input.userId,
      productId: input.productId,
      rating: input.rating,
      body: input.body,
      createdAt: new Date().toISOString(),
    };
    this.reviews.push(row);
    return this.toPublic(row);
  }

  async listRatings(productId: string): Promise<number[]> {
    return this.reviews.filter((r) => r.productId === productId).map((r) => r.rating);
  }
}
