import type { ProductLanguage, ProductSet } from '@akknerds/shared';
import englishSlugs from './data/set-slugs.en.json';

const SLUG_OVERRIDES: Partial<Record<ProductSet, string>> = {
  '151': 'pokemon-scarlet-&-violet-151',
  'Scarlet & Violet - 151': 'pokemon-scarlet-&-violet-151',
  'Scarlet & Violet': 'pokemon-scarlet-violet',
  'Scarlet & Violet Base': 'pokemon-scarlet-violet',
  'Pokemon Go': 'pokemon-go',
};

const englishMap = englishSlugs as Record<string, string>;

export const priceChartingBaseUrl = 'https://www.pricecharting.com';

export function priceChartingSetSlug(
  set: ProductSet,
  language: ProductLanguage = 'english',
): string | null {
  if (language !== 'english') return null;
  return SLUG_OVERRIDES[set] ?? englishMap[set] ?? null;
}

export function priceChartingSetPageUrl(
  set: ProductSet,
  language: ProductLanguage = 'english',
): string | null {
  const slug = priceChartingSetSlug(set, language);
  if (!slug) return null;
  return `${priceChartingBaseUrl}/console/${slug}`;
}
