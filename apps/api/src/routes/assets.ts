import { productImageObjectKey } from '@akknerds/shared';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';
import { rateLimit } from '../middleware/rate-limit.js';

const ensureThumbSchema = z.object({
  key: z.string().trim().min(1).max(240),
});

/**
 * Public asset helpers for the in-store kiosk.
 * Shop/storefront keeps using full CDN originals; kiosk prefers WebP thumbs.
 */
export function assetRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.post(
    '/ensure-thumb',
    rateLimit(deps.rateLimiter, { limit: 60, windowMs: 60_000 }, 'assets-thumb'),
    validate('json', ensureThumbSchema),
    async (c) => {
      if (!deps.storage.enabled) {
        return c.json({ error: 'Object storage is not configured' }, 503);
      }

      const { key } = c.req.valid('json');
      const sourceKey = productImageObjectKey(key);
      if (!sourceKey || sourceKey.startsWith('products/thumbs/')) {
        return c.json({ error: 'Invalid product image key' }, 400);
      }

      try {
        const thumb = await deps.storage.ensureProductThumb(sourceKey);
        return c.json({ key: thumb.key, url: thumb.url ?? null });
      } catch (error) {
        console.warn('[assets] ensure-thumb failed', sourceKey, error);
        return c.json({ error: 'Could not create thumbnail' }, 404);
      }
    },
  );

  return app;
}
