import type { Order, OrderLine, Product } from '@akknerds/shared';
import type { AppDeps } from '../context.js';
import type { StockAdjustment } from '../repositories/interfaces.js';

export type StockLine = { productId: string; quantity: number };

export function stockLinesFromOrder(order: Pick<Order, 'lines'> | { lines: OrderLine[] }): StockLine[] {
  return order.lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
  }));
}

async function resolveProducts(
  deps: Pick<AppDeps, 'products'>,
  lines: StockLine[],
): Promise<Array<{ product: Product; quantity: number }>> {
  const resolved: Array<{ product: Product; quantity: number }> = [];
  for (const line of lines) {
    const product = await deps.products.getByIdOrSlug(line.productId);
    if (!product) continue;
    resolved.push({ product, quantity: line.quantity });
  }
  return resolved;
}

/**
 * Reserve stock locally, then move the same qty in Zettle (STORE → SOLD).
 * If Zettle fails after a local reserve, local stock is released again.
 */
export async function reserveStockSynced(
  deps: Pick<AppDeps, 'products' | 'zettle'>,
  lines: StockLine[],
): Promise<{ ok: true } | { ok: false; productId?: string; error?: string }> {
  const local = await deps.products.reserveStock(lines as StockAdjustment[]);
  if (!local.ok) return local;

  try {
    const resolved = await resolveProducts(deps, lines);
    await deps.zettle.reserve(resolved);
    return { ok: true };
  } catch (error) {
    await deps.products.releaseStock(lines as StockAdjustment[]);
    const message = error instanceof Error ? error.message : 'Zettle reserve failed';
    return { ok: false, error: message };
  }
}

/** Put units back locally and in Zettle (SOLD → STORE). */
export async function releaseStockSynced(
  deps: Pick<AppDeps, 'products' | 'zettle'>,
  lines: StockLine[],
): Promise<void> {
  await deps.products.releaseStock(lines as StockAdjustment[]);
  try {
    const resolved = await resolveProducts(deps, lines);
    await deps.zettle.release(resolved);
  } catch (error) {
    // Local stock is already restored; log Zettle mismatch for ops.
    console.error('[zettle] release failed after local restore', error);
  }
}

/**
 * Cancel a non-cancelled order and put reserved units back on the shelf
 * (local + Zettle when linked).
 */
export async function cancelOrderAndReleaseStock(
  deps: Pick<AppDeps, 'orders' | 'products' | 'zettle'>,
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

  await releaseStockSynced(deps, stockLinesFromOrder(cancelled));
  return { order: cancelled, released: true };
}
