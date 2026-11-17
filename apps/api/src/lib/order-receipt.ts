import { orderReceiptUrl, type Order } from '@akknerds/shared';
import type { Env } from '../env.js';

function shopOrigin(env: Env): string {
  return (env.webOrigins[0] ?? 'http://localhost:5173').replace(/\/$/, '');
}

/** Attach a printable receipt URL for paid/fulfilled orders when none is stored. */
export function withReceiptInvoiceUrl(env: Env, order: Order): Order {
  if (order.invoiceUrl?.trim()) return order;
  if (order.status !== 'paid' && order.status !== 'fulfilled') return order;
  return {
    ...order,
    invoiceUrl: orderReceiptUrl(shopOrigin(env), order.id),
  };
}

export function receiptPageUrl(env: Env, orderId: string): string {
  return orderReceiptUrl(shopOrigin(env), orderId);
}
