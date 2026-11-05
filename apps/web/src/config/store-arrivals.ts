/**
 * Home teaser for sealed product that never lists online (storeOnly in admin).
 * Image keys match the live catalogue CDN paths — update here when stock/SKU changes.
 */
export const DELTA_REIGN_STORE_ARRIVAL = {
  set: 'Delta Reign',
  series: 'Mega Evolution',
  /** First day stock is expected in store (Europe/Stockholm, YYYY-MM-DD). */
  arrivesOn: '2026-11-11',
  /** Last day of the arrival window; used to flip copy to "in store now". */
  arrivesThrough: '2026-11-13',
  eyebrow: 'New · Store exclusive',
  title: 'Delta Reign, in store only',
  body: 'The newest Mega Evolution expansion lands in our Båstad shop first. Elite Trainer Boxes and blister packs will not be sold online. Come grab them in person.',
  products: [
    {
      name: 'Delta Reign ETB',
      label: 'Elite Trainer Box',
      image: 'products/mid3hSea3Etob4Dc.png',
    },
    {
      name: 'Delta Reign Blister Pack',
      label: 'Blister Pack',
      image: 'products/MPZAdDuzy0wz3d3I.webp',
    },
  ],
} as const;

/** Stockholm calendar date as YYYY-MM-DD. */
export function stockholmDateKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function hasStoreArrivalLanded(
  arrivesOn: string,
  now: Date = new Date(),
): boolean {
  return stockholmDateKey(now) >= arrivesOn;
}
