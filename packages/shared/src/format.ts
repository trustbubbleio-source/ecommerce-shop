/** Formatting helpers shared across the app. */

import { BASE_CURRENCY, currencyLocale } from './currency.js';

/**
 * Format an integer amount of minor units into a localized currency string.
 * Amounts are already in the given currency (no FX). Prefer `formatMoney` when
 * converting from the EUR catalog base for display.
 * @example formatPrice(1299, 'EUR') // "12,99 €" (sv-SE)
 */
export function formatPrice(
  cents: number,
  currency: string = BASE_CURRENCY,
  locale?: string,
): string {
  const code = currency.toUpperCase();
  return new Intl.NumberFormat(locale ?? currencyLocale(code), {
    style: 'currency',
    currency: code,
  }).format(cents / 100);
}

/** Convert an arbitrary label into a URL-safe slug. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Human-readable label for a product category. */
const CATEGORY_LABELS: Record<string, string> = {
  'booster-box': 'Booster Box',
  'elite-trainer-box': 'Elite Trainer Box',
  'booster-pack': 'Booster Pack',
  'single-card': 'Single Card',
  'graded-slab': 'Graded Slabs',
  bundle: 'Bundle',
  accessory: 'Accessory',
};

const CONDITION_LABELS: Record<string, string> = {
  mint: 'Mint',
  'near-mint': 'Near Mint',
  'lightly-played': 'Lightly Played',
  'moderately-played': 'Moderately Played',
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  'holo-rare': 'Holo Rare',
  'ultra-rare': 'Ultra Rare',
  'secret-rare': 'Secret Rare',
  'illustration-rare': 'Illustration Rare',
};

const LANGUAGE_LABELS: Record<string, string> = {
  english: 'English',
  japanese: 'Japanese',
  chinese: 'Chinese',
};

const TAG_LABELS: Record<string, string> = {
  'best-seller': 'Best seller',
  'single-card': 'Single card',
  'single-pack': 'Single pack',
  'full-art': 'Full art',
  etb: 'ETB',
};

export function tagLabel(tag: string): string {
  return TAG_LABELS[tag] ?? titleCase(tag.replace(/-/g, ' '));
}

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? titleCase(category.replace(/-/g, ' '));
}

export function conditionLabel(condition: string): string {
  return CONDITION_LABELS[condition] ?? titleCase(condition.replace(/-/g, ' '));
}

export function rarityLabel(rarity: string): string {
  return RARITY_LABELS[rarity] ?? titleCase(rarity.replace(/-/g, ' '));
}

export function languageLabel(language: string): string {
  return LANGUAGE_LABELS[language] ?? titleCase(language);
}

export function titleCase(value: string): string {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

type PreviewBadgeProduct = {
  category: string;
  cardNumber?: string;
  rarity?: string;
};

/** Compact label for the bottom-left badge on shop product cards (icon rendered separately). */
export function productPreviewBadge(product: PreviewBadgeProduct): string | null {
  if (product.cardNumber) return product.cardNumber;
  if (product.rarity) return null;
  if (product.category === 'single-card' || product.category === 'graded-slab') return null;
  return categoryLabel(product.category);
}

/** Percentage saved when a product has a compare-at price. */
export function discountPercent(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}
