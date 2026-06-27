import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { requireAuth } from '../middleware/auth.js';

export function orderRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  // Orders belonging to the authenticated user.
  app.get('/', requireAuth(), (c) => {
    const user = c.get('user')!;
    return c.json({ orders: deps.orders.listByUser(user.sub) });
  });

  // Single order lookup. The order id is an unguessable capability token, so
  // guests can view their confirmation; authenticated owners are still checked.
  app.get('/:id', (c) => {
    const order = deps.orders.get(c.req.param('id'));
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
