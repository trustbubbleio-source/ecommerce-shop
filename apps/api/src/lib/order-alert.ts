import { formatPrice, type Order } from '@akknerds/shared';
import type { Env } from '../env.js';
import type { EmailService } from './email.js';

function orderPageUrl(env: Env, orderId: string): string {
  const shop = env.webOrigins[0] ?? 'http://localhost:5173';
  return `${shop}/account/orders/${orderId}`;
}

export async function notifyPaidOrder(email: EmailService, env: Env, order: Order): Promise<void> {
  const shop = env.webOrigins[0] ?? 'http://localhost:5173';
  const first = order.lines[0]?.name ?? 'Order';
  const extra = order.lines.length - 1;
  try {
    await email.sendOrderConfirmation(order, orderPageUrl(env, order.id));
  } catch (error) {
    console.error('[email] order confirmation failed', error);
  }
  try {
    await email.sendPaidOrderAlert({
      orderId: order.id,
      email: order.email,
      totalLabel: formatPrice(order.total, order.currency),
      itemSummary: extra > 0 ? `${first} + ${extra} more` : first,
      city: order.shippingAddress?.city,
      adminUrl: `${shop}/admin/orders/${order.id}`,
    });
  } catch (error) {
    console.error('[email] paid order alert failed', error);
  }
}

export async function notifyCancelledOrder(
  email: EmailService,
  env: Env,
  order: Order,
  input: { refunded: boolean },
): Promise<boolean> {
  const reason = order.cancelReason?.trim();
  if (!reason) return false;
  try {
    await email.sendOrderCancelled(order, orderPageUrl(env, order.id), {
      reason,
      refunded: input.refunded,
    });
    return true;
  } catch (error) {
    console.error('[email] cancellation notice failed', error);
    return false;
  }
}

export async function notifyRefundedOrder(email: EmailService, env: Env, order: Order): Promise<void> {
  try {
    await email.sendOrderRefunded(order, orderPageUrl(env, order.id));
  } catch (error) {
    console.error('[email] refund notice failed', error);
  }
}
