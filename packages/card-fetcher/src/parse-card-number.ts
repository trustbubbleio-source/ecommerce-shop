/** Extract the collector number used on Pokellector (first segment of 178/165, or plain 286). */
export function parseCardNumberForLookup(raw: string): number | null {
  const trimmed = raw.trim().replace(/^#/, '');
  const slash = trimmed.match(/^(\d+)\s*\/\s*\d+$/);
  if (slash?.[1]) return Number.parseInt(slash[1], 10);
  const solo = trimmed.match(/^(\d+)$/);
  if (solo?.[1]) return Number.parseInt(solo[1], 10);
  return null;
}
