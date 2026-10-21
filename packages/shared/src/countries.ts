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

export const SHIPPING_COUNTRY_SET = new Set<string>(SHIPPING_COUNTRIES);

export function isShippingCountry(value: string): value is ShippingCountry {
  return SHIPPING_COUNTRY_SET.has(value);
}
