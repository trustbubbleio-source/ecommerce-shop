import type { Address } from './types.js';

/** Physical store used for click-and-collect orders. */
export const STORE_PICKUP = {
  street: 'Hallandsvägen 21',
  postalCode: '269 36',
  city: 'Båstad',
  country: 'Sweden',
  line: 'Hallandsvägen 21, 269 36 Båstad, Sweden',
  mapsUrl: 'https://maps.app.goo.gl/GB5yztXk94jZYEqAA',
} as const;

/** Authoritative ship-to for pickup orders (buyer name + store address). */
export function storePickupAddress(fullName: string): Address {
  return {
    fullName: fullName.trim(),
    line1: STORE_PICKUP.street,
    city: STORE_PICKUP.city,
    postalCode: STORE_PICKUP.postalCode,
    country: STORE_PICKUP.country,
  };
}
