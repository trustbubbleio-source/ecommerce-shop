import { createProductInputSchema, fetchCardImageInputSchema, updateProductInputSchema } from '@akknerds/shared';
import {
  CardFetchError,
  cardImageObjectKey,
  fetchCardImageFromPokellector,
  parseCardNumberForLookup,
} from '@akknerds/card-fetcher';
import {
  productToUpdateInput,
  syncSingleCardPrices,
  fetchUngradedPriceFromPriceCharting,
  PriceFetchError,
  type PriceSyncOutcome,
} from '@akknerds/price-fetcher';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';
import type { UploadableFile } from '../lib/storage.js';
import { requireAdmin } from '../middleware/admin.js';
import { requireAuth } from '../middleware/auth.js';

const ADMIN_PRODUCTS_PAGE_SIZE = 10;

const adminProductQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sortKey: z.enum(['name', 'category', 'price', 'stock', 'status']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

function collectFiles(raw: unknown): File[] {
  if (!raw) return [];
  return (Array.isArray(raw) ? raw : [raw]).filter((file): file is File => file instanceof File);
}

export function adminRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.get(
    '/products',
    requireAuth(),
    requireAdmin(deps),
    validate('query', adminProductQuerySchema),
    async (c) => {
      const q = c.req.valid('query');
      const limit = q.limit ?? ADMIN_PRODUCTS_PAGE_SIZE;
      const offset = q.offset ?? 0;
      const [page, stats] = await Promise.all([
        deps.products.listPage({
          filter: { search: q.search },
          adminSort: { key: q.sortKey ?? 'name', dir: q.sortDir ?? 'asc' },
          limit,
          offset,
        }),
        deps.products.catalogStats(),
      ]);
      return c.json({
        products: page.products,
        total: page.total,
        limit,
        offset,
        hasMore: offset + page.products.length < page.total,
        stats,
      });
    },
  );

  app.post('/uploads', requireAuth(), requireAdmin(deps), async (c) => {
    if (!deps.storage.enabled) {
      return c.json({ error: 'Object storage is not configured' }, 503);
    }

    const body = await c.req.parseBody({ all: true });
    const files = collectFiles(body.images);
    if (files.length === 0) {
      return c.json({ error: 'No images provided' }, 400);
    }
    if (files.length > 12) {
      return c.json({ error: 'You can upload up to 12 images at once' }, 400);
    }

    const uploadables: UploadableFile[] = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        buffer: Buffer.from(await file.arrayBuffer()),
      })),
    );

    try {
      const keys = await deps.storage.uploadProductImages(uploadables);
      return c.json({ keys }, 201);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Upload failed';
      return c.json({ error: message }, 400);
    }
  });

  app.get('/products/:id', requireAuth(), requireAdmin(deps), async (c) => {
    const product = await deps.products.getByIdOrSlug(c.req.param('id'));
    if (!product) return c.json({ error: 'Product not found' }, 404);
    return c.json({ product });
  });

  app.patch(
    '/products/:id',
    requireAuth(),
    requireAdmin(deps),
    validate('json', updateProductInputSchema),
    async (c) => {
      const input = c.req.valid('json');
      const product = await deps.products.update(c.req.param('id'), input);
      if (!product) return c.json({ error: 'Product not found' }, 404);
      return c.json({ product });
    },
  );

  app.post('/products', requireAuth(), requireAdmin(deps), validate('json', createProductInputSchema), async (c) => {
    const input = c.req.valid('json');
    const product = await deps.products.create(input);
    return c.json({ product }, 201);
  });

  app.post('/card-image', requireAuth(), requireAdmin(deps), validate('json', fetchCardImageInputSchema), async (c) => {
    if (!deps.storage.enabled) {
      return c.json({ error: 'Object storage is not configured' }, 503);
    }

    const input = c.req.valid('json');
    const lookupNumber = parseCardNumberForLookup(input.cardNumber);
    if (lookupNumber === null) {
      return c.json({ error: 'Enter a card number like 286 or 178/165' }, 400);
    }

    const objectKey = cardImageObjectKey({
      language: input.language,
      set: input.set,
      cardNumber: lookupNumber,
    });

    if (await deps.storage.objectExists(objectKey)) {
      return c.json({
        key: objectKey,
        previewUrl: deps.storage.resolvePublicUrl(objectKey),
        cached: true,
      });
    }

    try {
      const fetched = await fetchCardImageFromPokellector({
        set: input.set,
        cardNumber: input.cardNumber,
        language: input.language,
      });

      const key = await deps.storage.uploadProductImage(
        {
          name: `${fetched.cardNumber}.png`,
          type: fetched.contentType,
          buffer: fetched.buffer,
        },
        cardImageObjectKey({
          language: input.language,
          set: input.set,
          cardNumber: fetched.cardNumber,
        }),
      );

      return c.json({
        key,
        previewUrl: deps.storage.resolvePublicUrl(key),
        cardName: fetched.cardName,
        cardNumber: fetched.cardNumber,
        cached: false,
      });
    } catch (error) {
      if (error instanceof CardFetchError) {
        const status = error.code === 'not_found' ? 404 : error.code === 'unsupported' ? 422 : 502;
        return c.json({ error: error.message }, status);
      }
      const message = error instanceof Error ? error.message : 'Card image fetch failed';
      return c.json({ error: message }, 502);
    }
  });

  app.post('/sync-prices', requireAuth(), requireAdmin(deps), async (c) => {
    const products = await deps.products.list({ sort: 'name-asc' });
    const outcomes: PriceSyncOutcome[] = await syncSingleCardPrices(products, {
      onUpdate: async (product, priceCents) => {
        await deps.products.update(product.id, productToUpdateInput(product, priceCents));
      },
    });
    const summary = {
      updated: outcomes.filter((outcome) => outcome.status === 'updated').length,
      skipped: outcomes.filter((outcome) => outcome.status === 'skipped').length,
      errors: outcomes.filter((outcome) => outcome.status === 'error').length,
    };
    return c.json({ outcomes, summary });
  });

  app.post('/card-price', requireAuth(), requireAdmin(deps), validate('json', fetchCardImageInputSchema), async (c) => {
    const input = c.req.valid('json');

    try {
      const result = await fetchUngradedPriceFromPriceCharting({
        set: input.set,
        cardNumber: input.cardNumber,
        language: input.language,
      });
      return c.json({
        priceCents: result.priceCents,
        cardName: result.cardName,
        cardNumber: result.cardNumber,
        sourceUrl: result.sourceUrl,
      });
    } catch (error) {
      if (error instanceof PriceFetchError) {
        const status = error.code === 'not_found' ? 404 : error.code === 'unsupported' ? 422 : 502;
        return c.json({ error: error.message }, status);
      }
      const message = error instanceof Error ? error.message : 'Card price fetch failed';
      return c.json({ error: message }, 502);
    }
  });

  return app;
}
