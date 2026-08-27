import type { CartLine, OrderLine, Product } from './types.js';
import {
  BASE_CURRENCY,
  convertFromEur,
  normalizeCurrency,
  type SupportedCurrency,
} from './currency.js';
import { applyDiscountCode } from './discounts.js';

/** Free shipping kicks in at or above this subtotal (EUR cents). */
export const FREE_SHIPPING_THRESHOLD = 7500;
/** Flat shipping fee (EUR cents) applied below the free-shipping threshold. */
export const FLAT_SHIPPING_FEE = 599;

export function calcShipping(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_FEE;
}

/**
 * Carrier name + tracking URL are included from the same subtotal as free shipping.
 * Below that, the order page timeline is the live status (untracked postal).
 */
export function hasCarrierTracking(
  subtotal: number,
  currency: string = BASE_CURRENCY,
): boolean {
  return subtotal >= convertFromEur(FREE_SHIPPING_THRESHOLD, normalizeCurrency(currency));
}

/** Standard Swedish VAT on goods (percent). Catalogue prices are VAT-inclusive. */
export const VAT_PERCENT = 25;

/**
 * VAT already included in a gross amount (integer cents/öre).
 * 750,00 at 25% → 150,00 (`gross × 25 / 125`).
 */
export function vatIncludedIn(grossCents: number): number {
  if (grossCents <= 0) return 0;
  return Math.round((grossCents * VAT_PERCENT) / (100 + VAT_PERCENT));
}

export function calcSubtotal(lines: Array<Pick<OrderLine, 'unitPrice' | 'quantity'>>): number {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}

export interface PricedCart {
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  /** Cents removed by a promo code (merchandise only). */
  discount: number;
  discountCode?: string;
  total: number;
  currency: string;
}

function finalizeCart(
  lines: OrderLine[],
  currency: SupportedCurrency,
  discountCode?: string | null,
  hasCompletedOrder = false,
): PricedCart {
  const subtotal = calcSubtotal(lines);
  const baseShipping = calcShipping(subtotal);
  const applied = applyDiscountCode(subtotal, baseShipping, discountCode, { hasCompletedOrder });
  const shipping = applied?.shipping ?? baseShipping;
  const discount = applied?.amount ?? 0;
  return toDisplayCurrency(
    {
      lines,
      subtotal,
      shipping,
      discount,
      discountCode: applied?.code,
      total: Math.max(0, subtotal + shipping - discount),
      currency: BASE_CURRENCY,
    },
    currency,
  );
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
  const discount = convertFromEur(priced.discount, currency);
  return {
    lines,
    subtotal,
    shipping,
    discount,
    discountCode: priced.discountCode,
    total: Math.max(0, subtotal + shipping - discount),
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
  discountCode?: string | null,
  hasCompletedOrder = false,
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

  return finalizeCart(lines, normalizeCurrency(currency), discountCode, hasCompletedOrder);
}

/** Async variant for database-backed product lookups. */
export async function priceCartAsync(
  items: CartLine[],
  lookup: (productId: string) => Promise<Product | undefined>,
  currency: string = BASE_CURRENCY,
  discountCode?: string | null,
  hasCompletedOrder = false,
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

  return finalizeCart(lines, normalizeCurrency(currency), discountCode, hasCompletedOrder);
}
