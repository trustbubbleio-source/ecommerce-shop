import type { CartLine, OrderLine, Product } from './types.js';
import {
  BASE_CURRENCY,
  convertFromEur,
  normalizeCurrency,
  type SupportedCurrency,
} from './currency.js';

/** Free shipping kicks in at or above this subtotal (EUR cents). */
export const FREE_SHIPPING_THRESHOLD = 7500;
/** Flat shipping fee (EUR cents) applied below the free-shipping threshold. */
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

function toDisplayCurrency(priced: PricedCart, currency: SupportedCurrency): PricedCart {
  if (currency === BASE_CURRENCY) {
    return { ...priced, currency: BASE_CURRENCY };
  }

  const lines = priced.lines.map((line) => ({
    ...line,
    unitPrice: convertFromEur(line.unitPrice, currency),
  }));
  const subtotal = calcSubtotal(lines);
  const shipping = convertFromEur(priced.shipping, currency);
  return {
    lines,
    subtotal,
    shipping,
    total: subtotal + shipping,
    currency,
  };
}

/**
 * Re-price a cart from the authoritative catalog. Client-supplied prices are
 * never trusted; quantities are clamped to available stock. Unknown products
 * and out-of-stock lines are dropped.
 *
 * Catalog amounts are EUR. Pass `currency` to convert the priced cart for
 * Stripe / order storage (e.g. `sek`).
 */
export function priceCart(
  items: CartLine[],
  lookup: (productId: string) => Product | undefined,
  currency: string = BASE_CURRENCY,
): PricedCart {
  const lines: OrderLine[] = [];

  for (const item of items) {
    const product = lookup(item.productId);
    if (!product || product.stock <= 0) continue;
    const quantity = Math.min(Math.max(1, Math.floor(item.quantity)), product.stock);
    if (quantity <= 0) continue;
    lines.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity,
    });
  }

  const subtotal = calcSubtotal(lines);
  const shipping = calcShipping(subtotal);
  return toDisplayCurrency(
    { lines, subtotal, shipping, total: subtotal + shipping, currency: BASE_CURRENCY },
    normalizeCurrency(currency),
  );
}

/** Async variant for database-backed product lookups. */
export async function priceCartAsync(
  items: CartLine[],
  lookup: (productId: string) => Promise<Product | undefined>,
  currency: string = BASE_CURRENCY,
): Promise<PricedCart> {
  const lines: OrderLine[] = [];

  for (const item of items) {
    const product = await lookup(item.productId);
    if (!product || product.stock <= 0) continue;
    const quantity = Math.min(Math.max(1, Math.floor(item.quantity)), product.stock);
    if (quantity <= 0) continue;
    lines.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity,
    });
  }

  const subtotal = calcSubtotal(lines);
  const shipping = calcShipping(subtotal);
  return toDisplayCurrency(
    { lines, subtotal, shipping, total: subtotal + shipping, currency: BASE_CURRENCY },
    normalizeCurrency(currency),
  );
}
