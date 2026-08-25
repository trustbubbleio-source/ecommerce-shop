/** Server-authoritative promo codes. Never trust a client-supplied amount. */

export type DiscountKind = 'percent' | 'fixed' | 'free_shipping';

export interface DiscountCodeDef {
  /** Canonical uppercase code. */
  code: string;
  /** Short human label shown on the account Discount page. */
  label: string;
  kind: DiscountKind;
  /**
   * Meaning depends on `kind`:
   * - percent: 1–100
   * - fixed: EUR cents off the subtotal
   * - free_shipping: ignored
   */
  value: number;
  /**
   * Auto-assigned when a new account is created. Cannot be typed in manually
   * (stops code-sharing with existing members).
   */
  autoAssignOnSignup?: boolean;
  /** Only applied when the member has no paid/fulfilled orders yet. */
  firstOrderOnly?: boolean;
}

/** Welcome offer for brand-new accounts — not shown publicly before signup. */
export const WELCOME_DISCOUNT_CODE = 'ONEMORERIP10';

export const DISCOUNT_CODES: readonly DiscountCodeDef[] = [
  {
    code: WELCOME_DISCOUNT_CODE,
    label: '10% off your first order',
    kind: 'percent',
    value: 10,
    autoAssignOnSignup: true,
    firstOrderOnly: true,
  },
  { code: 'RIP5', label: '€5 off', kind: 'fixed', value: 500 },
  { code: 'FREESHIP', label: 'Free shipping', kind: 'free_shipping', value: 0 },
] as const;

export function normalizeDiscountCode(code: string): string {
  return code.trim().toUpperCase();
}

export function findDiscountCode(code: string | null | undefined): DiscountCodeDef | undefined {
  if (!code) return undefined;
  const normalized = normalizeDiscountCode(code);
  return DISCOUNT_CODES.find((entry) => entry.code === normalized);
}

export function isWelcomeDiscountCode(code: string | null | undefined): boolean {
  const def = findDiscountCode(code);
  return Boolean(def?.autoAssignOnSignup);
}

export function isManualDiscountAllowed(code: string | null | undefined): boolean {
  if (code == null) return true;
  const def = findDiscountCode(code);
  if (!def) return false;
  return !def.autoAssignOnSignup;
}

export interface AppliedDiscount {
  code: string;
  label: string;
  /** Cents removed from the merchandise subtotal (never from shipping). */
  amount: number;
  /** Shipping after the code (0 when free shipping is granted). */
  shipping: number;
}

export interface ApplyDiscountOptions {
  /** When true, first-order-only codes are skipped. */
  hasCompletedOrder?: boolean;
}

/**
 * Apply a known discount code to a cart priced in EUR cents.
 * Unknown / empty codes leave amounts unchanged.
 */
export function applyDiscountCode(
  subtotal: number,
  shipping: number,
  code: string | null | undefined,
  options: ApplyDiscountOptions = {},
): AppliedDiscount | null {
  const def = findDiscountCode(code);
  if (!def || subtotal <= 0) return null;
  if (def.firstOrderOnly && options.hasCompletedOrder) return null;

  if (def.kind === 'free_shipping') {
    return { code: def.code, label: def.label, amount: 0, shipping: 0 };
  }

  let amount = 0;
  if (def.kind === 'percent') {
    amount = Math.floor((subtotal * def.value) / 100);
  } else if (def.kind === 'fixed') {
    amount = Math.min(def.value, subtotal);
  }

  return {
    code: def.code,
    label: def.label,
    amount: Math.max(0, amount),
    shipping,
  };
}
