/** CARTO dark basemap URL for Leaflet (`VITE_CARTO_API_KEY` → `?key=`). */
export function cartoDarkTileUrl(): string {
  const base =
    'https://{s}.basemaps.cartocdn.com/rastertiles/dark_matter/{z}/{x}/{y}.png';
  const key = import.meta.env.VITE_CARTO_API_KEY?.trim();
  if (!key) return base;
  return `${base}?key=${encodeURIComponent(key)}`;
}

export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
