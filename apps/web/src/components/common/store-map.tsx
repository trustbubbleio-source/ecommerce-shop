import { ExternalLink } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { SITE } from '../../config/site';

const MAPS_QUERY = encodeURIComponent(SITE.store.line);
const MAPS_LINK = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`;

/**
 * Dark interactive map (Leaflet + Carto dark tiles). Loaded only when mounted
 * so Leaflet stays out of the main shop bundle.
 */
export function StoreMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let cancelled = false;
    let map: import('leaflet').Map | undefined;

    void (async () => {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      if (cancelled || !containerRef.current) return;

      const { lat, lng } = SITE.store;
      map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: false,
      }).setView([lat, lng], 15);

      L.control.zoom({ position: 'topright' }).addTo(map);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const pin = L.divIcon({
        className: 'omr-map-pin',
        html: `<span class="omr-map-pin__pulse"></span><span class="omr-map-pin__dot"></span>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([lat, lng], { icon: pin })
        .addTo(map)
        .bindPopup(
          `<strong>${SITE.legalName}</strong><br/>${SITE.store.street}<br/>${SITE.store.postalCode} ${SITE.store.city}`,
          { closeButton: false },
        );

      // Leaflet needs a layout pass after mount in flex/grid containers.
      requestAnimationFrame(() => map?.invalidateSize());
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  return (
    <div className="border-border group relative overflow-hidden rounded-2xl border">
      <div
        ref={containerRef}
        role="img"
        aria-label={`Map showing ${SITE.store.line}`}
        className="omr-store-map bg-muted h-52 w-full sm:h-60"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/20"
        aria-hidden
      />
      <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/55 px-2.5 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-sm">
        {SITE.store.city}, Sweden
      </div>
      <a
        href={MAPS_LINK}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-foreground border-border relative z-10 flex items-center justify-center gap-1.5 border-t bg-card/80 px-3 py-2.5 text-xs font-medium backdrop-blur-sm"
      >
        Open in Google Maps
        <ExternalLink className="size-3.5" />
      </a>
      <style>{`
        .omr-store-map .leaflet-container {
          background: hsl(0 0% 7%);
          font: inherit;
        }
        .omr-store-map .leaflet-control-attribution {
          background: rgba(0, 0, 0, 0.45) !important;
          color: rgba(255, 255, 255, 0.45);
          font-size: 9px;
          max-width: 55%;
        }
        .omr-store-map .leaflet-control-attribution a {
          color: rgba(255, 255, 255, 0.55);
        }
        .omr-store-map .leaflet-control-zoom a {
          background: rgba(12, 12, 12, 0.88) !important;
          color: rgba(255, 255, 255, 0.85) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
          width: 28px !important;
          height: 28px !important;
          line-height: 28px !important;
        }
        .omr-store-map .leaflet-control-zoom a:hover {
          background: rgba(28, 28, 28, 0.95) !important;
        }
        .omr-store-map .leaflet-popup-content-wrapper {
          background: hsl(0 0% 8%);
          color: hsl(0 0% 92%);
          border-radius: 10px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .omr-store-map .leaflet-popup-tip {
          background: hsl(0 0% 8%);
        }
        .omr-store-map .leaflet-popup-content {
          margin: 10px 12px;
          font-size: 12px;
          line-height: 1.45;
        }
        .omr-map-pin {
          background: transparent !important;
          border: none !important;
        }
        .omr-map-pin__dot {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 14px;
          height: 14px;
          margin: -7px 0 0 -7px;
          border-radius: 9999px;
          background: hsl(264 72% 58%);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.9), 0 0 18px hsl(264 72% 58% / 0.7);
        }
        .omr-map-pin__pulse {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 28px;
          height: 28px;
          margin: -14px 0 0 -14px;
          border-radius: 9999px;
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
