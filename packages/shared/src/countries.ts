/**
 * Destinations we ship to within Europe (EU + EEA + common neighbours).
 * Stored as English country names on addresses (not ISO codes).
 */
export const SHIPPING_COUNTRIES = [
  'Austria',
  'Belgium',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czechia',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Germany',
  'Greece',
  'Hungary',
  'Iceland',
  'Ireland',
  'Italy',
  'Latvia',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Netherlands',
  'Norway',
  'Poland',
  'Portugal',
  'Romania',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland',
  'United Kingdom',
] as const;

export type ShippingCountry = (typeof SHIPPING_COUNTRIES)[number];

/** ISO 3166-1 alpha-2 for PayPal / carriers. Keys match SHIPPING_COUNTRIES. */
export const SHIPPING_COUNTRY_ISO: Record<ShippingCountry, string> = {
  Austria: 'AT',
  Belgium: 'BE',
  Bulgaria: 'BG',
  Croatia: 'HR',
  Cyprus: 'CY',
  Czechia: 'CZ',
  Denmark: 'DK',
  Estonia: 'EE',
  Finland: 'FI',
  France: 'FR',
  Germany: 'DE',
  Greece: 'GR',
  Hungary: 'HU',
  Iceland: 'IS',
  Ireland: 'IE',
  Italy: 'IT',
  Latvia: 'LV',
  Liechtenstein: 'LI',
  Lithuania: 'LT',
  Luxembourg: 'LU',
  Malta: 'MT',
  Netherlands: 'NL',
  Norway: 'NO',
  Poland: 'PL',
  Portugal: 'PT',
  Romania: 'RO',
  Slovakia: 'SK',
  Slovenia: 'SI',
  Spain: 'ES',
  Sweden: 'SE',
  Switzerland: 'CH',
  'United Kingdom': 'GB',
};

export const SHIPPING_COUNTRY_SET = new Set<string>(SHIPPING_COUNTRIES);
const SHIPPING_ISO_SET = new Set(Object.values(SHIPPING_COUNTRY_ISO));

export function isShippingCountry(value: string): value is ShippingCountry {
  return SHIPPING_COUNTRY_SET.has(value);
}

/**
 * Map a stored shipping country name (or already-ISO code) to ISO 3166-1 alpha-2.
 * Falls back to SE for the shop's home market when unknown.
 *
 * Important: do NOT take the first two letters of a name ("Sweden" → "SW").
 */
export function toShippingCountryIso(country: string | null | undefined): string {
  const raw = (country ?? '').trim();
  if (!raw) return 'SE';
  const upper = raw.toUpperCase();
  if (raw.length === 2 && SHIPPING_ISO_SET.has(upper)) return upper;
  if (isShippingCountry(raw)) return SHIPPING_COUNTRY_ISO[raw];
  return 'SE';
}
