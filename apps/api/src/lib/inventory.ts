import type { Order, OrderLine } from '@akknerds/shared';
import type { AppDeps } from '../context.js';

export type StockLine = { productId: string; quantity: number };

export function stockLinesFromOrder(order: Pick<Order, 'lines'> | { lines: OrderLine[] }): StockLine[] {
  return order.lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
  }));
}

/**
 * Cancel a non-cancelled order and put reserved units back on the shelf.
 * `orders.cancel` is idempotent — only the first successful cancel releases stock.
 */
export async function cancelOrderAndReleaseStock(
  deps: Pick<AppDeps, 'orders' | 'products'>,
  orderId: string,
  reason: string,
): Promise<{ order: Order; released: boolean } | undefined> {
  const existing = await deps.orders.get(orderId);
  if (!existing) return undefined;
  if (existing.status === 'cancelled') {
    return { order: existing, released: false };
  }
  if (existing.status === 'fulfilled' || existing.fulfillmentStep === 'delivered') {
    return undefined;
  }

  const cancelled = await deps.orders.cancel(orderId, reason);
  if (!cancelled) {
    const latest = await deps.orders.get(orderId);
    if (latest?.status === 'cancelled') return { order: latest, released: false };
    return undefined;
  }

  await deps.products.releaseStock(stockLinesFromOrder(cancelled));
  return { order: cancelled, released: true };
}
