import type { ProductFilter, SortKey } from '@akknerds/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';

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
  featured: bool.optional(),
  isNew: bool.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export function productRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.get('/', validate('query', productQuerySchema), (c) => {
    const q = c.req.valid('query');
    const filter: ProductFilter = {
      category: q.category as ProductFilter['category'],
      series: q.series,
      search: q.search,
      minPrice: q.minPrice,
      maxPrice: q.maxPrice,
      inStockOnly: q.inStock,
    };
    const products = deps.products.list({
      filter,
      sort: q.sort,
      featured: q.featured,
      isNew: q.isNew,
      limit: q.limit,
    });
    return c.json({ products, total: products.length });
  });

  app.get('/meta', (c) => c.json(deps.products.meta()));

  app.get('/:idOrSlug', (c) => {
    const product = deps.products.getByIdOrSlug(c.req.param('idOrSlug'));
    if (!product) {
      return c.json({ error: 'Product not found' }, 404);
    }
    return c.json({ product });
  });

  return app;
}
