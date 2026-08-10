import type { ProductLanguage, ProductSet } from '@akknerds/shared';
import englishSlugs from './data/set-slugs.en.json';

/** Shop set names that differ from Pokellector labels or are aliases. */
const SLUG_OVERRIDES: Partial<Record<ProductSet, string>> = {
  '151': 'Scarlet-Violet-151-Expansion',
  'Scarlet & Violet Base': 'Scarlet-Violet-English-Expansion',
};

const englishMap = englishSlugs as Record<string, string>;

export function pokellectorBaseUrl(language: ProductLanguage): string | null {
  if (language === 'english') return 'https://www.pokellector.com';
  if (language === 'japanese') return 'https://jp.pokellector.com';
  return null;
}

export function pokellectorSetSlug(set: ProductSet, language: ProductLanguage): string | null {
  if (language === 'chinese') return null;
  if (language === 'english') {
    return SLUG_OVERRIDES[set] ?? englishMap[set] ?? null;
  }
  // Japanese Pokellector uses different set names; reuse slug when the label matches.
  return englishMap[set] ?? SLUG_OVERRIDES[set] ?? null;
}

export function pokellectorSetPageUrl(set: ProductSet, language: ProductLanguage): string | null {
  const base = pokellectorBaseUrl(language);
  const slug = pokellectorSetSlug(set, language);
  if (!base || !slug) return null;
  return `${base}/${slug}/`;
}
