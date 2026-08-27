import { formatPrice, type Order } from '@akknerds/shared';
import type { Env } from '../env.js';
import type { EmailService } from './email.js';

export async function notifyPaidOrder(email: EmailService, env: Env, order: Order): Promise<void> {
  const shop = env.webOrigins[0] ?? 'http://localhost:5173';
  const first = order.lines[0]?.name ?? 'Order';
  const extra = order.lines.length - 1;
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
