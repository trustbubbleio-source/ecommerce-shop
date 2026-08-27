import { updateOrderFulfillmentSchema } from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { validate } from '../lib/http.js';
import { requireAdmin } from '../middleware/admin.js';
import { requireAuth } from '../middleware/auth.js';

export function adminOrderRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.get('/', requireAuth(), requireAdmin(deps), async (c) => {
    const orders = await deps.orders.listAll();
    return c.json({ orders });
  });

  app.get('/:id', requireAuth(), requireAdmin(deps), async (c) => {
    const order = await deps.orders.get(c.req.param('id'));
    if (!order) return c.json({ error: 'Order not found' }, 404);
    return c.json({ order });
  });

  app.patch(
    '/:id',
    requireAuth(),
    requireAdmin(deps),
    validate('json', updateOrderFulfillmentSchema),
    async (c) => {
      const body = c.req.valid('json');
      const existing = await deps.orders.get(c.req.param('id'));
      if (!existing) return c.json({ error: 'Order not found' }, 404);
      if (existing.status !== 'paid' && existing.status !== 'fulfilled') {
        return c.json({ error: 'Only paid orders can be fulfilled' }, 409);
      }
      const order = await deps.orders.updateFulfillment(c.req.param('id'), {
        fulfillmentStep: body.fulfillmentStep,
        carrierName: body.carrierName,
        trackingUrl: body.trackingUrl,
      });
      if (!order) return c.json({ error: 'Order not found' }, 404);
      return c.json({ order });
    },
  );

  return app;
}
