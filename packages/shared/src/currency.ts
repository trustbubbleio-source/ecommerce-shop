/**
 * Shop money: catalog, cart, checkout and Stripe are always SEK öre (`BASE_CURRENCY`).
 * EUR is no longer offered — legacy EUR order rows are converted only when formatting.
 */

export const BASE_CURRENCY = 'sek' as const;

/** @deprecated Alias of BASE_CURRENCY — kept so older call sites keep compiling briefly. */
export const DEFAULT_DISPLAY_CURRENCY = BASE_CURRENCY;

export const SUPPORTED_CURRENCIES = ['sek'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Former EUR→SEK display rate. Used only to migrate legacy EUR catalogue/order
 * amounts into öre (not for live FX at checkout).
 */
export const LEGACY_EUR_TO_SEK = 11.3;

/** @deprecated Use LEGACY_EUR_TO_SEK — name kept for older imports. */
export const EUR_TO_SEK = LEGACY_EUR_TO_SEK;

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  sek: 'SEK',
};

export function isSupportedCurrency(value: string): value is SupportedCurrency {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(value.toLowerCase());
}

export function normalizeCurrency(value: string | undefined | null): SupportedCurrency {
  if (value && isSupportedCurrency(value)) return value.toLowerCase() as SupportedCurrency;
  return BASE_CURRENCY;
}

/** Locale for Intl currency formatting. */
export function currencyLocale(currency: string): string {
  switch (currency.toLowerCase()) {
    case 'sek':
    case 'eur':
      return 'sv-SE';
    default:
      return 'en-US';
  }
}

/**
 * Convert a legacy EUR-cent amount into SEK öre.
 * Identity when `to` is already SEK / when amount is already öre.
 */
export function convertFromEur(centsEur: number, to: SupportedCurrency = BASE_CURRENCY): number {
  if (to === 'sek') return Math.round(centsEur * LEGACY_EUR_TO_SEK);
  return Math.round(centsEur);
}

/** Normalize a stored amount into SEK öre (handles legacy `eur` order rows). */
export function toSekOre(amount: number, storedCurrency: string | undefined | null): number {
  if ((storedCurrency ?? '').toLowerCase() === 'eur') {
    return Math.round(amount * LEGACY_EUR_TO_SEK);
  }
  return Math.round(amount);
}

/** Format SEK öre (or convert legacy EUR cents) for display. */
export function formatMoney(
  amount: number,
  storedCurrency: string = BASE_CURRENCY,
): string {
  const ore = toSekOre(amount, storedCurrency);
  return new Intl.NumberFormat(currencyLocale('sek'), {
    style: 'currency',
    currency: 'SEK',
  }).format(ore / 100);
}
