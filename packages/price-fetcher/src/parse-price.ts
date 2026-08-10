/** Parse a PriceCharting dollar string like "$1,234.56" into integer cents. */
export function parsePriceChartingDollars(value: string): number | null {
  const cleaned = value.replace(/[$,\s]/g, '');
  if (!cleaned || cleaned === '-') return null;
  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}
