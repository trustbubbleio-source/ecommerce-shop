import type { Order } from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { requireAuth } from '../middleware/auth.js';

async function withInvoiceUrl(deps: AppDeps, order: Order): Promise<Order> {
  if (order.invoiceUrl) return order;
  if (order.status !== 'paid' && order.status !== 'fulfilled') return order;
  const sessionId = order.stripeSessionId;
  if (!sessionId) return order;
  try {
    const doc = await deps.payments.resolveInvoiceDocument(sessionId);
    if (!doc) return order;
    await deps.orders.setInvoiceUrl(order.id, doc.url);
    return { ...order, invoiceUrl: doc.url };
  } catch {
    return order;
  }
}

export function orderRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  // Orders belonging to the authenticated user.
  app.get('/', requireAuth(), async (c) => {
    const user = c.get('user')!;
    const orders = await deps.orders.listByUser(user.sub);
    return c.json({
      orders: await Promise.all(orders.map((order) => withInvoiceUrl(deps, order))),
    });
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
    return c.json({ order: await withInvoiceUrl(deps, order) });
  });

  return app;
}
