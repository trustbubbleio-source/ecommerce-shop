import { parsePriceChartingDollars } from './parse-price.js';

export interface PriceChartingCardEntry {
  title: string;
  cardNumber: number;
  ungradedPriceCents: number;
  detailPath: string;
}

const PRODUCT_ROW_RE =
  /<tr[^>]*id="product-\d+"[^>]*>[\s\S]*?<td class="title"[^>]*>[\s\S]*?<a href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<td class="price numeric used_price">[\s\S]*?<span class="js-price">\$?([^<]+)<\/span>/gi;

export function parseCardNumberFromTitle(title: string): number | null {
  const match = title.trim().match(/#(\d+)\s*$/);
  if (!match?.[1]) return null;
  return Number.parseInt(match[1], 10);
}

export function normalizeCardName(value: string): string {
  return value
    .toLowerCase()
    .replace(/#(\d+)\s*$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function parseSetPageHtml(html: string): PriceChartingCardEntry[] {
  const entries: PriceChartingCardEntry[] = [];
  for (const match of html.matchAll(PRODUCT_ROW_RE)) {
    const detailPath = match[1] ?? '';
    const title = (match[2] ?? '').trim();
    const priceCents = parsePriceChartingDollars(match[3] ?? '');
    const cardNumber = parseCardNumberFromTitle(title);
    if (!title || cardNumber === null || priceCents === null) continue;
    entries.push({
      title,
      cardNumber,
      ungradedPriceCents: priceCents,
      detailPath,
    });
  }
  return entries;
}

export function findCardOnSetPage(
  entries: PriceChartingCardEntry[],
  cardNumber: number,
  name?: string,
): PriceChartingCardEntry | null {
  const byNumber = entries.filter((entry) => entry.cardNumber === cardNumber);
  if (byNumber.length === 1) return byNumber[0]!;
  if (byNumber.length > 1 && name) {
    const target = normalizeCardName(name);
    const named = byNumber.find((entry) => normalizeCardName(entry.title).includes(target));
    if (named) return named;
  }
  if (byNumber.length > 0) return byNumber[0]!;
  if (name) {
    const target = normalizeCardName(name);
    return entries.find((entry) => normalizeCardName(entry.title).includes(target)) ?? null;
  }
  return null;
}
