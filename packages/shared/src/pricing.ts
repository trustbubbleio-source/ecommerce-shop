import type { CartLine, OrderLine, Product } from './types.js';
import { BASE_CURRENCY, normalizeCurrency } from './currency.js';
import {
  applyDiscountDef,
  findDiscountCode,
  normalizeDiscountCode,
  type ApplyDiscountOptions,
  type DiscountCodeDef,
} from './discounts.js';

/** Free shipping kicks in at or above this subtotal (SEK öre). Was €75 → ~848 SEK. */
export const FREE_SHIPPING_THRESHOLD = 84_750;
/** Flat shipping fee (SEK öre) below the free-shipping threshold. Was €5.99 → ~68 SEK. */
export const FLAT_SHIPPING_FEE = 6_769;

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
  _currency: string = BASE_CURRENCY,
): boolean {
  return subtotal >= FREE_SHIPPING_THRESHOLD;
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
  discountDef: DiscountCodeDef | null | undefined,
  options: ApplyDiscountOptions = {},
): PricedCart {
  const subtotal = calcSubtotal(lines);
  const baseShipping = calcShipping(subtotal);
  const applied = applyDiscountDef(discountDef, subtotal, baseShipping, options);
  const shipping = applied?.shipping ?? baseShipping;
  const discount = applied?.amount ?? 0;
  return {
    lines,
    subtotal,
    shipping,
    discount,
    discountCode: applied?.code,
    total: Math.max(0, subtotal + shipping - discount),
    currency: BASE_CURRENCY,
  };
}

/**
 * Re-price a cart from the authoritative catalog. Client-supplied prices are
 * never trusted; quantities are clamped to available stock. Unknown products
 * and out-of-stock lines are dropped.
 *
 * Catalog amounts are SEK öre. `currency` is accepted for API compatibility but
 * always resolves to SEK.
 */
export function priceCart(
  items: CartLine[],
  lookup: (productId: string) => Product | undefined,
  currency: string = BASE_CURRENCY,
  discountCode?: string | null,
  options: ApplyDiscountOptions = {},
): PricedCart {
  void normalizeCurrency(currency);
  const lines: OrderLine[] = [];

  for (const item of items) {
    const product = lookup(item.productId);
    if (!product || product.stock <= 0 || product.storeOnly || product.inactive) continue;
    const quantity = Math.min(Math.max(1, Math.floor(item.quantity)), product.stock);
    if (quantity <= 0) continue;
    lines.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity,
    });
  }

  return finalizeCart(lines, findDiscountCode(discountCode), options);
}

export type PriceCartAsyncOptions = ApplyDiscountOptions & {
  /** Resolve admin/DB codes when the built-in catalogue misses. */
  resolveDiscount?: (code: string) => Promise<DiscountCodeDef | undefined>;
};

/** Async variant for database-backed product lookups. */
export async function priceCartAsync(
  items: CartLine[],
  lookup: (productId: string) => Promise<Product | undefined>,
  currency: string = BASE_CURRENCY,
  discountCode?: string | null,
  options: PriceCartAsyncOptions = {},
): Promise<PricedCart> {
  const lines: OrderLine[] = [];

  for (const item of items) {
    const product = await lookup(item.productId);
    if (!product || product.stock <= 0 || product.storeOnly || product.inactive) continue;
    const quantity = Math.min(Math.max(1, Math.floor(item.quantity)), product.stock);
    if (quantity <= 0) continue;
    lines.push({
      productId: product.id,
      name: product.name,
      unitPrice: product.price,
      quantity,
    });
  }

  void normalizeCurrency(currency);

  let discountDef = findDiscountCode(discountCode);
  if (!discountDef && discountCode && options.resolveDiscount) {
    discountDef = await options.resolveDiscount(normalizeDiscountCode(discountCode));
  }

  return finalizeCart(lines, discountDef, options);
}
