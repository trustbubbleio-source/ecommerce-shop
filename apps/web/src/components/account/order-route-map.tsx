import type { Address } from '@akknerds/shared';
import { ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { SITE } from '../../config/site';
import { formatAddress } from '../../lib/order-progress';

interface OrderRouteMapProps {
  destination?: Address;
}

interface LatLng {
  lat: number;
  lng: number;
}

async function geocode(query: string): Promise<LatLng | null> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return null;
  const rows = (await res.json()) as Array<{ lat: string; lon: string }>;
  const hit = rows[0];
  if (!hit) return null;
  return { lat: Number(hit.lat), lng: Number(hit.lon) };
}

/**
 * Dark Leaflet map from the Båstad shop to the delivery address.
 * Leaflet is loaded on mount so it stays out of the main shop bundle.
 */
export function OrderRouteMap({ destination }: OrderRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const destQuery = destination ? formatAddress(destination) : '';
  const mapsLink = destQuery
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(SITE.store.line)}&destination=${encodeURIComponent(destQuery)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.store.line)}`;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let map: import('leaflet').Map | undefined;

    void (async () => {
      try {
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');
        if (cancelled || !containerRef.current) return;

        const origin: LatLng = { lat: SITE.store.lat, lng: SITE.store.lng };
        const dest = destQuery ? await geocode(destQuery) : null;
        if (cancelled || !containerRef.current) return;

        map = L.map(containerRef.current, {
          zoomControl: false,
          attributionControl: true,
          scrollWheelZoom: false,
        }).setView([origin.lat, origin.lng], dest ? 6 : 15);

        L.control.zoom({ position: 'topright' }).addTo(map);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }).addTo(map);

        const originPin = L.divIcon({
          className: 'omr-map-pin',
          html: `<span class="omr-map-pin__pulse"></span><span class="omr-map-pin__dot"></span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        L.marker([origin.lat, origin.lng], { icon: originPin })
          .addTo(map)
          .bindPopup(`<strong>${SITE.legalName}</strong><br/>${SITE.store.line}`, {
            closeButton: false,
          });

        if (dest) {
          const destPin = L.divIcon({
            className: 'omr-map-pin omr-map-pin--dest',
            html: `<span class="omr-map-pin__dot omr-map-pin__dot--dest"></span>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });
          L.marker([dest.lat, dest.lng], { icon: destPin })
            .addTo(map)
            .bindPopup(`<strong>Delivery</strong><br/>${destQuery}`, { closeButton: false });
          L.polyline(
            [
              [origin.lat, origin.lng],
              [dest.lat, dest.lng],
            ],
            { color: 'hsl(264 72% 58%)', weight: 3, opacity: 0.85, dashArray: '6 8' },
          ).addTo(map);
          map.fitBounds(
            [
              [origin.lat, origin.lng],
              [dest.lat, dest.lng],
            ],
            { padding: [36, 36] },
          );
        }

        requestAnimationFrame(() => map?.invalidateSize());
      } catch {
        // Leaflet is decorative; a failed load still leaves the address + Maps link.
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [destQuery]);

  return (
    <div className="border-border overflow-hidden rounded-2xl border">
      <div
        ref={containerRef}
        role="img"
        aria-label={
          destQuery
            ? `Shipping route from ${SITE.store.city} to ${destination?.city}`
            : `Map showing ${SITE.store.line}`
        }
        className="omr-store-map bg-muted h-52 w-full sm:h-60"
      />
      <a
        href={mapsLink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground border-border flex items-center justify-center gap-1.5 border-t bg-card/80 px-3 py-2.5 text-xs font-medium"
      >
        Open route in Google Maps
        <ExternalLink className="size-3.5" />
      </a>
      <style>{`
        .omr-store-map .leaflet-container { background: hsl(0 0% 7%); font: inherit; }
        .omr-store-map .leaflet-control-attribution {
          background: rgba(0, 0, 0, 0.45) !important;
          color: rgba(255, 255, 255, 0.45);
          font-size: 9px;
          max-width: 55%;
        }
        .omr-store-map .leaflet-control-attribution a { color: rgba(255, 255, 255, 0.55); }
        .omr-store-map .leaflet-control-zoom a {
          background: rgba(12, 12, 12, 0.88) !important;
          color: rgba(255, 255, 255, 0.85) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          width: 28px !important;
          height: 28px !important;
          line-height: 28px !important;
        }
        .omr-map-pin { background: transparent !important; border: none !important; }
        .omr-map-pin__dot {
          position: absolute; left: 50%; top: 50%; width: 14px; height: 14px;
          margin: -7px 0 0 -7px; border-radius: 9999px;
          background: hsl(264 72% 58%);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9), 0 0 18px hsl(264 72% 58% / 0.7);
        }
        .omr-map-pin__dot--dest {
          width: 12px; height: 12px; margin: -6px 0 0 -6px;
          background: hsl(152 60% 45%);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9);
        }
        .omr-map-pin__pulse {
          position: absolute; left: 50%; top: 50%; width: 28px; height: 28px;
          margin: -14px 0 0 -14px; border-radius: 9999px;
          background: hsl(264 72% 58% / 0.35);
          animation: omr-pin-pulse 2.2s ease-out infinite;
        }
        @keyframes omr-pin-pulse {
          0% { transform: scale(0.55); opacity: 0.85; }
          70% { transform: scale(1.35); opacity: 0; }
          100% { transform: scale(1.35); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
