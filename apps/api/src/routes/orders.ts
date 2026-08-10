import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { requireAuth } from '../middleware/auth.js';

export function orderRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  // Orders belonging to the authenticated user.
  app.get('/', requireAuth(), async (c) => {
    const user = c.get('user')!;
    const orders = await deps.orders.listByUser(user.sub);
    return c.json({ orders });
  });

  // Single order lookup. The order id is an unguessable capability token, so
  // guests can view their confirmation; authenticated owners are still checked.
  app.get('/:id', async (c) => {
    const order = await deps.orders.get(c.req.param('id'));
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    const user = c.get('user');
    if (order.userId && user && order.userId !== user.sub) {
      return c.json({ error: 'You do not have access to this order' }, 403);
    }
    return c.json({ order });
  });

  return app;
}
