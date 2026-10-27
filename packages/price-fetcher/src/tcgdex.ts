import type { ProductLanguage, ProductSet } from '@akknerds/shared';

const BASE_URL = 'https://api.tcgdex.net/v2';

/** Map our catalog set labels onto TCGdex English set names when they differ. */
const SET_NAME_OVERRIDES: Partial<Record<string, string>> = {
  '151': '151',
  'Scarlet & Violet - 151': '151',
  'Scarlet & Violet Base': 'Scarlet & Violet',
  'Pokemon Go': 'Pokémon GO',
  'Pokémon GO': 'Pokémon GO',
};

export function tcgdexLocale(language: ProductLanguage): string {
  switch (language) {
    case 'japanese':
      return 'ja';
    case 'chinese':
      return 'zh-cn';
    case 'english':
    default:
      return 'en';
  }
}

export function tcgdexSetSearchName(set: ProductSet): string {
  return SET_NAME_OVERRIDES[set] ?? set;
}

export interface TcgdexCardBrief {
  id: string;
  localId: string;
  name: string;
  image?: string;
}

export interface TcgdexCardmarketPricing {
  unit?: string;
  avg?: number | null;
  low?: number | null;
  trend?: number | null;
  avg1?: number | null;
  avg7?: number | null;
  avg30?: number | null;
  'avg-holo'?: number | null;
  'low-holo'?: number | null;
  'trend-holo'?: number | null;
  idProduct?: number;
}

export interface TcgdexCardDetail extends TcgdexCardBrief {
  variants_detailed?: Array<{
    type?: string;
    pricing?: {
      cardmarket?: TcgdexCardmarketPricing | null;
      tcgplayer?: unknown;
    };
  }>;
  pricing?: {
    cardmarket?: TcgdexCardmarketPricing | null;
  };
  set?: { id: string; name: string };
}

export async function tcgdexGetJson<T>(
  path: string,
  fetchImpl: typeof fetch,
  timeoutMs = 15_000,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${BASE_URL}${path}`, {
      signal: controller.signal,
      headers: {
        accept: 'application/json',
        'user-agent': 'OneMoreRip-price-fetcher/1.0 (+https://onemorerip.shop)',
      },
    });
    if (!res.ok) {
      throw new Error(`TCGdex returned ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Prefer Cardmarket trend (EUR), then averages / low; include holo fields for holo-only cards. */
export function extractCardmarketPriceEur(card: TcgdexCardDetail): number | null {
  const pools: Array<TcgdexCardmarketPricing | null | undefined> = [
    ...(card.variants_detailed ?? []).map((variant) => variant.pricing?.cardmarket),
    card.pricing?.cardmarket,
  ];

  for (const cm of pools) {
    if (!cm) continue;
    const candidates = [
      cm.trend,
      cm.avg,
      cm.avg7,
      cm.avg30,
      cm.avg1,
      cm.low,
      cm['trend-holo'],
      cm['avg-holo'],
      cm['low-holo'],
    ];
    for (const value of candidates) {
      if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return value;
      }
    }
  }
  return null;
}

export function pickTcgdexCard(
  briefs: TcgdexCardBrief[],
  lookupNumber: number,
  name?: string,
): TcgdexCardBrief | null {
  const exact = briefs.filter(
    (card) => Number.parseInt(card.localId.replace(/^0+/, '') || '0', 10) === lookupNumber,
  );
  if (exact.length === 1) return exact[0]!;
  if (exact.length > 1 && name) {
    const target = normalizeName(name);
    const named = exact.find((card) => normalizeName(card.name).includes(target));
    if (named) return named;
  }
  if (exact.length > 0) return exact[0]!;
  if (name) {
    const target = normalizeName(name);
    return briefs.find((card) => normalizeName(card.name).includes(target)) ?? null;
  }
  return null;
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/#\d+\s*$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
