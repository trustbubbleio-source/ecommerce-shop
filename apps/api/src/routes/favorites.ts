import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { requireAuth } from '../middleware/auth.js';

export function favoriteRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.get('/', requireAuth(), async (c) => {
    const user = c.get('user')!;
    const products = await deps.favorites.listProducts(user.sub);
    return c.json({ products });
  });

  app.get('/ids', requireAuth(), async (c) => {
    const user = c.get('user')!;
    const productIds = await deps.favorites.listProductIds(user.sub);
    return c.json({ productIds });
  });

  app.post('/:productId', requireAuth(), async (c) => {
    const user = c.get('user')!;
    const productId = c.req.param('productId');
    const ok = await deps.favorites.add(user.sub, productId);
    if (!ok) return c.json({ error: 'Product not found' }, 404);
    const productIds = await deps.favorites.listProductIds(user.sub);
    return c.json({ ok: true, productIds }, 201);
  });

  app.delete('/:productId', requireAuth(), async (c) => {
    const user = c.get('user')!;
    const productId = c.req.param('productId');
    await deps.favorites.remove(user.sub, productId);
    const productIds = await deps.favorites.listProductIds(user.sub);
    return c.json({ ok: true, productIds });
  });

  return app;
}
