import { formatPrice, type Order } from '@akknerds/shared';
import { orderOpsLabel } from './order-progress';

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Flat CSV for bokföring / Excel — one row per order line. */
export function ordersToCsv(orders: Order[]): string {
  const header = [
    'order_id',
    'created_at',
    'channel',
    'status',
    'ops_label',
    'email',
    'product_id',
    'product_name',
    'quantity',
    'unit_price_cents',
    'line_total_cents',
    'order_shipping_cents',
    'order_total_cents',
    'currency',
    'formatted_total',
  ];

  const rows: string[] = [header.join(',')];
  for (const order of orders) {
    for (const line of order.lines) {
      rows.push(
        [
          order.id,
          order.createdAt,
          order.channel,
          order.status,
          orderOpsLabel(order),
          order.email,
          line.productId,
          line.name,
          String(line.quantity),
          String(line.unitPrice),
          String(line.unitPrice * line.quantity),
          String(order.shipping),
          String(order.total),
          order.currency,
          formatPrice(order.total, order.currency),
        ]
          .map((cell) => csvEscape(String(cell)))
          .join(','),
      );
    }
  }
  return `${rows.join('\n')}\n`;
}

export function downloadOrdersCsv(orders: Order[], filename = 'onemorerip-orders.csv'): void {
  const blob = new Blob([ordersToCsv(orders)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
