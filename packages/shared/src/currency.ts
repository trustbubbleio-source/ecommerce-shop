/**
 * Shop money: catalog & cart math are always EUR cents (`BASE_CURRENCY`).
 * Shoppers and the physical store default to SEK display (`DEFAULT_DISPLAY_CURRENCY`).
 */

export const BASE_CURRENCY = 'eur' as const;

/** Default currency for storefront, checkout, and new user profiles (Sweden-first). */
export const DEFAULT_DISPLAY_CURRENCY = 'sek' as const;

/** SEK first so the header switcher matches the store default. */
export const SUPPORTED_CURRENCIES = ['sek', 'eur'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * Fixed display/checkout rate: 1.00 EUR → this many SEK (öre via convertFromEur).
 * Update when you want a fresher commercial rate; checkout uses the same constant.
 */
export const EUR_TO_SEK = 11.3;

export const CURRENCY_LABELS: Record<SupportedCurrency, string> = {
  sek: 'SEK',
  eur: 'EUR',
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
 * Convert an amount stored in EUR minor units (cents) into the target currency’s
 * minor units (öre for SEK). Rounds to the nearest integer.
 */
export function convertFromEur(centsEur: number, to: SupportedCurrency): number {
  if (to === 'eur') return Math.round(centsEur);
  return Math.round(centsEur * EUR_TO_SEK);
}

/** Format EUR-base cents for a display currency (converts when needed). Defaults to SEK. */
export function formatMoney(
  centsEur: number,
  displayCurrency: string = DEFAULT_DISPLAY_CURRENCY,
): string {
  const currency = normalizeCurrency(displayCurrency);
  const amount = convertFromEur(centsEur, currency);
  return new Intl.NumberFormat(currencyLocale(currency), {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}
