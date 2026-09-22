/** CARTO dark basemap URL for Leaflet (`VITE_CARTO_API_KEY` → `?key=`). */
export function cartoDarkTileUrl(): string {
  // Keep the classic `dark_all` raster path — `rastertiles/dark_matter` 404s.
  const base = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const key = import.meta.env.VITE_CARTO_API_KEY?.trim();
  if (!key) return base;
  return `${base}?key=${encodeURIComponent(key)}`;
}

export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
