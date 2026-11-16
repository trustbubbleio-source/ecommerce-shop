import type { AppDeps } from '../context.js';
import { cancelOrderAndReleaseStock } from './inventory.js';
import { captureAndSettle, settlePaidBySession } from './settle-payment.js';

/**
 * Reap stale pending online checkouts: settle if PayPal already captured/approved,
 * otherwise cancel and release stock.
 */
export async function reapPendingOrders(
  deps: Pick<AppDeps, 'orders' | 'products' | 'zettle' | 'payments' | 'email' | 'env' | 'users' | 'discounts'>,
  olderThan: Date,
): Promise<{ scanned: number; paid: number; cancelled: number }> {
  const stale = await deps.orders.listPendingOlderThan(olderThan);
  let paid = 0;
  let cancelled = 0;

  for (const order of stale) {
    if (order.channel !== 'online') continue;
    const sessionId = order.paymentSessionId;
    if (!sessionId) {
      await cancelOrderAndReleaseStock(
        deps,
        order.id,
        'Payment not completed in time.',
      );
      cancelled += 1;
      continue;
    }

    try {
      const details = await deps.payments.getOrder(sessionId);
      const captureStatus =
        details.purchase_units?.[0]?.payments?.captures?.[0]?.status?.toUpperCase();
      const orderStatus = details.status?.toUpperCase();

      if (captureStatus === 'COMPLETED' || orderStatus === 'COMPLETED') {
        const settled = await settlePaidBySession(deps as AppDeps, sessionId, order.id);
        if (settled) paid += 1;
        continue;
      }

      if (orderStatus === 'APPROVED') {
        const result = await captureAndSettle(deps as AppDeps, order, sessionId, {
          skip3ds: false,
        });
        if (result.kind === 'paid') {
          paid += 1;
          continue;
        }
      }
    } catch (error) {
      console.error('[pending-orders] PayPal lookup failed for', order.id, error);
    }

    await cancelOrderAndReleaseStock(deps, order.id, 'Payment not completed in time.');
    cancelled += 1;
  }

  return { scanned: stale.length, paid, cancelled };
}
