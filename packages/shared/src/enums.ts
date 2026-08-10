/**
 * Canonical product enum values for the API, admin UI, and Zod validation.
 * Series/set taxonomy: packages/shared/src/series-sets.ts (Pokellector mapping).
 * Prisma schema enums mirror these — run `pnpm --filter @akknerds/db sync:enums`.
 */

export {
  SERIES_SET_MAP,
  PRODUCT_SERIES,
  PRODUCT_SETS,
  setsForSeries,
  isSetInSeries,
} from './series-sets.js';
export type { ProductSeries, ProductSet } from './series-sets.js';

export const PRODUCT_CATEGORIES = [
  'booster-box',
  'elite-trainer-box',
  'booster-pack',
  'single-card',
  'graded-slab',
  'bundle',
  'accessory',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

/** Categories that use the clean card image + number/rarity badge on shop cards. */
export const CARD_STYLE_CATEGORIES = ['single-card', 'graded-slab'] as const;

export type CardStyleCategory = (typeof CARD_STYLE_CATEGORIES)[number];

export function isCardStyleCategory(category: ProductCategory): category is CardStyleCategory {
  return category === 'single-card' || category === 'graded-slab';
}

export const CARD_RARITIES = [
  'common',
  'uncommon',
  'rare',
  'holo-rare',
  'ultra-rare',
  'secret-rare',
  'illustration-rare',
] as const;

export type CardRarity = (typeof CARD_RARITIES)[number];

export const CARD_CONDITIONS = [
  'mint',
  'near-mint',
  'lightly-played',
  'moderately-played',
] as const;

export type CardCondition = (typeof CARD_CONDITIONS)[number];

export const PRODUCT_LANGUAGES = ['english', 'japanese', 'chinese'] as const;

export type ProductLanguage = (typeof PRODUCT_LANGUAGES)[number];

/** Curated product tags stored in Supabase and used for shop search. */
export const PRODUCT_TAGS = [
  'sealed',
  'new',
  'best-seller',
  'chase',
  'full-art',
  'graded',
  'vintage',
  'gift',
  'value',
  'premium',
  'competitive',
  'meta',
  'charizard',
  'pikachu',
  'mewtwo',
  'giratina',
  'psychic',
  'gold',
  'kanto',
  'paldea',
  'single-card',
  'single-pack',
  'etb',
  'bundle',
  'sleeves',
  'binder',
  'toploaders',
  'protection',
  'storage',
] as const;

export type ProductTag = (typeof PRODUCT_TAGS)[number];
