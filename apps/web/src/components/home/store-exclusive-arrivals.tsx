import { resolveAssetUrl } from '@akknerds/shared';
import { Button } from '@akknerds/ui';
import { CalendarDays, MapPin, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  DELTA_REIGN_STORE_ARRIVAL,
  hasStoreArrivalLanded,
} from '../../config/store-arrivals';
import { SITE } from '../../config/site';

function arrivalCopy(arrived: boolean): { badge: string; when: string } {
  if (arrived) {
    return {
      badge: 'In store now',
      when: 'Available in our Båstad shop. Not sold online.',
    };
  }
  return {
    badge: 'Arrives November 10-11',
    when: 'Dropping in store around November 10-11. Exclusive to the physical shop.',
  };
}

export function StoreExclusiveArrivals() {
  const cdn = import.meta.env.VITE_ASSET_CDN_URL;
  const arrived = hasStoreArrivalLanded(DELTA_REIGN_STORE_ARRIVAL.arrivesThrough);
  const timing = arrivalCopy(arrived);

  return (
    <section className="container py-12" aria-labelledby="store-exclusive-arrivals-heading">
      <div className="border-border relative overflow-hidden rounded-2xl border">
        <div
          className="from-foreground/8 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent"
          aria-hidden="true"
        />
        <div
          className="bg-grid-faint pointer-events-none absolute inset-0 opacity-10 [background-size:28px_28px]"
          aria-hidden="true"
        />

        <div className="relative grid items-center gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          {/* Products left / copy right — mirrors the store announcement above */}
          <ul className="grid grid-cols-2 gap-3 sm:gap-4">
            {DELTA_REIGN_STORE_ARRIVAL.products.map((product) => {
              const imageUrl = resolveAssetUrl(product.image, cdn);
              return (
                <li
                  key={product.name}
                  className="border-border bg-card/80 group relative flex flex-col overflow-hidden rounded-xl border"
                >
                  <div className="bg-muted/30 relative aspect-[5/7] overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="absolute inset-0 size-full object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-[1.04] sm:p-4"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="bg-secondary absolute inset-0" aria-hidden="true" />
                    )}
                    <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/95 backdrop-blur-sm">
                      New
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 p-3 sm:p-4">
                    <p className="text-muted-foreground text-[10px] font-semibold uppercase tracking-[0.16em] sm:text-xs">
                      {product.label}
                    </p>
                    <p className="text-foreground text-sm font-bold leading-snug sm:text-base">
                      {product.name}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs font-medium">
                      Store exclusive
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-col gap-4">
            <span className="border-border bg-secondary text-foreground inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              <Store className="size-3.5" aria-hidden />
              {DELTA_REIGN_STORE_ARRIVAL.eyebrow}
            </span>

            <h2
              id="store-exclusive-arrivals-heading"
              className="text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              {DELTA_REIGN_STORE_ARRIVAL.title}
            </h2>

            <p className="text-muted-foreground max-w-md text-base leading-relaxed sm:text-lg">
              {DELTA_REIGN_STORE_ARRIVAL.body}
            </p>

            <p className="text-foreground inline-flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="text-primary size-4 shrink-0" aria-hidden />
              <span>{timing.badge}</span>
            </p>
            <p className="text-muted-foreground -mt-2 text-sm">{timing.when}</p>

            <p className="text-muted-foreground inline-flex items-start gap-2 text-sm">
              <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{SITE.store.line}</span>
            </p>

            <div className="mt-2 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href={SITE.store.mapsUrl} target="_blank" rel="noopener noreferrer">
                  Get directions
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/contact#opening-hours">Opening hours</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
