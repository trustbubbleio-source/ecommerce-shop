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
  /** When set, only this email (case-insensitive) may use the code. */
  allowedEmail?: string | null;
  /** When set, only this user id may use the code. */
  allowedUserId?: string | null;
  /**
   * Clear the code from the member profile after a successful paid order.
   * Defaults to true for user-scoped codes; false for general promos.
   */
  clearAfterPurchase?: boolean;
  /** Admin-managed codes can be deactivated without deleting the row. */
  active?: boolean;
}

/** Welcome offer for brand-new accounts — not shown publicly before signup. */
export const WELCOME_DISCOUNT_CODE = 'ONEMORERIP10';

/** Built-in catalogue (always available). Admin can add more in the database. */
export const DISCOUNT_CODES: readonly DiscountCodeDef[] = [
  {
    code: WELCOME_DISCOUNT_CODE,
    label: '10% off your first order',
    kind: 'percent',
    value: 10,
    autoAssignOnSignup: true,
    firstOrderOnly: true,
    clearAfterPurchase: true,
  },
  { code: 'RIP5', label: '€5 off', kind: 'fixed', value: 500 },
  { code: 'FREESHIP', label: 'Free shipping', kind: 'free_shipping', value: 0 },
] as const;

export function normalizeDiscountCode(code: string): string {
  return code.trim().toUpperCase();
}

export function normalizeDiscountEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Lookup in the built-in catalogue only (sync). */
export function findDiscountCode(code: string | null | undefined): DiscountCodeDef | undefined {
  if (!code) return undefined;
  const normalized = normalizeDiscountCode(code);
  return DISCOUNT_CODES.find((entry) => entry.code === normalized);
}

export function isWelcomeDiscountCode(code: string | null | undefined): boolean {
  const def = findDiscountCode(code);
  return Boolean(def?.autoAssignOnSignup);
}

export function isManualDiscountAllowed(def: DiscountCodeDef | null | undefined): boolean {
  if (!def) return false;
  return !def.autoAssignOnSignup;
}

export function canUserUseDiscount(
  def: DiscountCodeDef,
  options: { userEmail?: string | null; userId?: string | null } = {},
): boolean {
  if (def.active === false) return false;

  if (def.allowedUserId) {
    if (!options.userId || options.userId !== def.allowedUserId) return false;
  }
  if (def.allowedEmail) {
    if (
      !options.userEmail ||
      normalizeDiscountEmail(options.userEmail) !== normalizeDiscountEmail(def.allowedEmail)
    ) {
      return false;
    }
  }
  return true;
}

/** Whether the profile-saved code should be cleared after a paid order. */
export function shouldClearDiscountAfterPurchase(def: DiscountCodeDef): boolean {
  if (def.clearAfterPurchase === true) return true;
  if (def.clearAfterPurchase === false) return false;
  return Boolean(def.allowedEmail || def.allowedUserId || def.autoAssignOnSignup);
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
  userEmail?: string | null;
  userId?: string | null;
}

/**
 * Apply a resolved discount definition to a cart priced in EUR cents.
 * Returns null when the code does not apply for this shopper/cart.
 */
export function applyDiscountDef(
  def: DiscountCodeDef | null | undefined,
  subtotal: number,
  shipping: number,
  options: ApplyDiscountOptions = {},
): AppliedDiscount | null {
  if (!def || subtotal <= 0) return null;
  if (def.active === false) return null;
  if (def.firstOrderOnly && options.hasCompletedOrder) return null;
  if (!canUserUseDiscount(def, options)) return null;

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

/**
 * Apply a known built-in discount code to a cart priced in EUR cents.
 * Unknown / empty codes leave amounts unchanged.
 */
export function applyDiscountCode(
  subtotal: number,
  shipping: number,
  code: string | null | undefined,
  options: ApplyDiscountOptions = {},
): AppliedDiscount | null {
  return applyDiscountDef(findDiscountCode(code), subtotal, shipping, options);
}
