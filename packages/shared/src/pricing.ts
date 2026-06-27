import type { CartLine, OrderLine, Product } from './types.js';

/** Free shipping kicks in at or above this subtotal (cents). */
export const FREE_SHIPPING_THRESHOLD = 7500;
/** Flat shipping fee (cents) applied below the free-shipping threshold. */
export const FLAT_SHIPPING_FEE = 599;

export function calcShipping(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
}

export function calcSubtotal(lines: Array<Pick<OrderLine, 'unitPrice' | 'quantity'>>): number {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}

export interface PricedCart {
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
}

/**
 * Re-price a cart from the authoritative catalog. Client-supplied prices are
 * never trusted; quantities are clamped to available stock. Unknown products
 * and out-of-stock lines are dropped.
 */
export function priceCart(
  items: CartLine[],
  lookup: (productId: string) => Product | undefined,
): PricedCart {
  const lines: OrderLine[] = [];
  let currency = 'usd';

  for (const item of items) {
    const product = lookup(item.productId);
    if (!product || product.stock <= 0) continue;
    const quantity = Math.min(Math.max(1, Math.floor(item.quantity)), product.stock);
    if (quantity <= 0) continue;
    currency = product.currency;
    lines.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity,
    });
  }

  const subtotal = calcSubtotal(lines);
  const shipping = calcShipping(subtotal);
  return { lines, subtotal, shipping, total: subtotal + shipping, currency };
}
