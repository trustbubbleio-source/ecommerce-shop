/**
 * Home teaser for sealed product that never lists online (storeOnly in admin).
 * Image keys match the live catalogue CDN paths — update here when stock/SKU changes.
 * Stock landed in the Båstad shop on 10 Nov 2026, ahead of the 11–13 window.
 */
export const DELTA_REIGN_STORE_ARRIVAL = {
  set: 'Delta Reign',
  series: 'Mega Evolution',
  /** First day stock is expected in store (Europe/Stockholm, YYYY-MM-DD). */
  arrivesOn: '2026-11-10',
  /** Arrival window is over; home copy stays on the in-store message. */
  arrivesThrough: '2026-11-10',
  eyebrow: 'In store · Limited stock',
  title: 'Delta Reign, in store only',
  body: 'Delta Reign is finally in our Båstad shop. Elite Trainer Boxes and blister packs are not sold online, and stock is limited. Come grab them in person.',
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
