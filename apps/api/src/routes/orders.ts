import type { Order } from '@akknerds/shared';
import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { cancelOrderAndReleaseStock } from '../lib/inventory.js';
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

/** Same access rules as GET /:id — owner session, or guest capability token. */
function canAccessOrder(order: Order, userSub: string | undefined): 'ok' | 401 | 403 {
  if (!order.userId) return 'ok';
  if (!userSub) return 401;
  if (order.userId !== userSub) return 403;
  return 'ok';
}

export function orderRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  // Paid / fulfilled / cancelled only — hide abandoned Stripe checkouts.
  app.get('/', requireAuth(), async (c) => {
    const user = c.get('user')!;
    const orders = (await deps.orders.listByUser(user.sub)).filter(
      (order) => order.status !== 'pending',
    );
    return c.json({
      orders: await Promise.all(orders.map((order) => withInvoiceUrl(deps, order))),
    });
  });

  // Guest orders (no userId): id is an unguessable capability token for the
  // success page. Account-linked orders require the owning session.
  app.get('/:id', async (c) => {
    const order = await deps.orders.get(c.req.param('id'));
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    const access = canAccessOrder(order, c.get('user')?.sub);
    if (access !== 'ok') {
      return c.json(
        { error: access === 401 ? 'Authentication required' : 'You do not have access to this order' },
        access,
      );
    }
    return c.json({ order: await withInvoiceUrl(deps, order) });
  });

  /**
   * Customer abandoned Stripe Checkout (cancel_url). Cancels the pending
   * reservation and restores stock so the cart can reconcile correctly.
   */
  app.post('/:id/abandon', async (c) => {
    const order = await deps.orders.get(c.req.param('id'));
    if (!order) {
      return c.json({ error: 'Order not found' }, 404);
    }
    const access = canAccessOrder(order, c.get('user')?.sub);
    if (access !== 'ok') {
      return c.json(
        { error: access === 401 ? 'Authentication required' : 'You do not have access to this order' },
        access,
      );
    }
    if (order.status !== 'pending') {
      return c.json({ order, abandoned: false });
    }
    const result = await cancelOrderAndReleaseStock(
      deps,
      order.id,
      'Checkout cancelled before payment.',
    );
    if (!result) {
      return c.json({ error: 'Could not abandon this order' }, 409);
    }
    return c.json({ order: result.order, abandoned: result.released });
  });

  return app;
}
