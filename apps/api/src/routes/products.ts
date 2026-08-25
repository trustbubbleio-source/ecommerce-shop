import type { ProductFilter, SortKey } from '@akknerds/shared';
import { CARD_CONDITIONS, PRODUCT_LANGUAGES, createProductReviewInputSchema } from '@akknerds/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';
import { aggregateRatings } from '../lib/review-stats.js';
import { requireAuth } from '../middleware/auth.js';

const SORT_KEYS = [
  'featured',
  'newest',
  'price-asc',
  'price-desc',
  'name-asc',
  'rating',
] as const satisfies readonly SortKey[];

const bool = z.enum(['true', 'false']).transform((v) => v === 'true');

const productQuerySchema = z.object({
  category: z.string().optional(),
  series: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(SORT_KEYS).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  inStock: bool.optional(),
  language: z.enum(PRODUCT_LANGUAGES).optional(),
  condition: z.enum(CARD_CONDITIONS).optional(),
  featured: bool.optional(),
  isNew: bool.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export function productRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.get('/', validate('query', productQuerySchema), async (c) => {
    const q = c.req.valid('query');
    const filter: ProductFilter = {
      category: q.category as ProductFilter['category'],
      series: q.series,
      search: q.search,
      minPrice: q.minPrice,
      maxPrice: q.maxPrice,
      inStockOnly: q.inStock,
      language: q.language,
      condition: q.condition,
    };
    const offset = q.offset ?? 0;
    const page = await deps.products.listPage({
      filter,
      sort: q.sort,
      featured: q.featured,
      isNew: q.isNew,
      limit: q.limit,
      offset,
    });
    const hasMore = offset + page.products.length < page.total;
    return c.json({
      products: page.products,
      total: page.total,
      limit: q.limit ?? null,
      offset,
      hasMore,
    });
  });

  app.get('/meta', async (c) => c.json(await deps.products.meta()));

  app.get('/:idOrSlug/reviews', requireAuth(), async (c) => {
    const product = await deps.products.getByIdOrSlug(c.req.param('idOrSlug'));
    if (!product) return c.json({ error: 'Product not found' }, 404);

    const user = c.get('user')!;
    const [reviews, myReview, purchased] = await Promise.all([
      deps.reviews.listByProduct(product.id),
      deps.reviews.findByUserAndProduct(user.sub, product.id),
      deps.orders.hasPurchasedProduct(user.sub, product.id),
    ]);

    return c.json({
      reviews,
      canReview: purchased && !myReview,
      myReview: myReview ?? null,
    });
  });

  app.post(
    '/:idOrSlug/reviews',
    requireAuth(),
    validate('json', createProductReviewInputSchema),
    async (c) => {
      const product = await deps.products.getByIdOrSlug(c.req.param('idOrSlug'));
      if (!product) return c.json({ error: 'Product not found' }, 404);

      const user = c.get('user')!;
      const existing = await deps.reviews.findByUserAndProduct(user.sub, product.id);
      if (existing) {
        return c.json({ error: 'You already reviewed this product' }, 409);
      }

      const purchased = await deps.orders.hasPurchasedProduct(user.sub, product.id);
      if (!purchased) {
        return c.json({ error: 'Only verified buyers can leave a review' }, 403);
      }

      const input = c.req.valid('json');
      const review = await deps.reviews.create({
        userId: user.sub,
        productId: product.id,
        rating: input.rating,
        body: input.body,
      });

      const ratings = await deps.reviews.listRatings(product.id);
      await deps.products.setRatingStats(product.id, aggregateRatings(ratings));

      return c.json({ review }, 201);
    },
  );

  app.get('/:idOrSlug', async (c) => {
    const product = await deps.products.getByIdOrSlug(c.req.param('idOrSlug'));
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }
    return c.json({ product });
  });

  return app;
}
