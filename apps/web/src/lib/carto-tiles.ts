/** CARTO dark basemap URL for Leaflet (API key from `VITE_CARTO_API_KEY`). */
export function cartoDarkTileUrl(): string {
  const base = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const key = import.meta.env.VITE_CARTO_API_KEY?.trim();
  if (!key) return base;
  return `${base}?api_key=${encodeURIComponent(key)}`;
}

export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
