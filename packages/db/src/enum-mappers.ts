import type {
  CardCondition,
  CardRarity,
  ProductCategory,
  ProductLanguage,
  ProductSeries,
  ProductSet,
} from '@akknerds/shared';
import { PRODUCT_SERIES, PRODUCT_SETS, toPrismaEnumKey } from '@akknerds/shared';
import {
  CardCondition as PrismaCardCondition,
  CardRarity as PrismaCardRarity,
  ProductCategory as PrismaProductCategory,
  ProductLanguage as PrismaProductLanguage,
  ProductSeries as PrismaProductSeries,
  ProductSet as PrismaProductSet,
} from '@prisma/client';

const CATEGORY_TO_PRISMA = {
  'booster-box': PrismaProductCategory.booster_box,
  'elite-trainer-box': PrismaProductCategory.elite_trainer_box,
  'booster-pack': PrismaProductCategory.booster_pack,
  'single-card': PrismaProductCategory.single_card,
  'graded-slab': PrismaProductCategory.graded_slab,
  bundle: PrismaProductCategory.bundle,
  accessory: PrismaProductCategory.accessory,
} as const satisfies Record<ProductCategory, PrismaProductCategory>;

const SERIES_TO_PRISMA = Object.fromEntries(
  PRODUCT_SERIES.map((series) => [series, toPrismaEnumKey(series)]),
) as Record<ProductSeries, PrismaProductSeries>;

const SET_TO_PRISMA = Object.fromEntries(
  PRODUCT_SETS.map((set) => [set, toPrismaEnumKey(set)]),
) as Record<ProductSet, PrismaProductSet>;

const CATEGORY_FROM_PRISMA = invert(CATEGORY_TO_PRISMA) as Record<
  PrismaProductCategory,
  ProductCategory
>;
const SERIES_FROM_PRISMA = invert(SERIES_TO_PRISMA) as Record<PrismaProductSeries, ProductSeries>;
const SET_FROM_PRISMA = invert(SET_TO_PRISMA) as Record<PrismaProductSet, ProductSet>;
const RARITY_TO_PRISMA = {
  common: PrismaCardRarity.common,
  uncommon: PrismaCardRarity.uncommon,
  rare: PrismaCardRarity.rare,
  'holo-rare': PrismaCardRarity.holo_rare,
  'ultra-rare': PrismaCardRarity.ultra_rare,
  'secret-rare': PrismaCardRarity.secret_rare,
  'illustration-rare': PrismaCardRarity.illustration_rare,
} as const satisfies Record<CardRarity, PrismaCardRarity>;

const CONDITION_TO_PRISMA = {
  mint: PrismaCardCondition.mint,
  'near-mint': PrismaCardCondition.near_mint,
  'lightly-played': PrismaCardCondition.lightly_played,
  'moderately-played': PrismaCardCondition.moderately_played,
} as const satisfies Record<CardCondition, PrismaCardCondition>;

const LANGUAGE_TO_PRISMA = {
  english: PrismaProductLanguage.english,
  japanese: PrismaProductLanguage.japanese,
  chinese: PrismaProductLanguage.chinese,
} as const satisfies Record<ProductLanguage, PrismaProductLanguage>;

function invert<M extends Record<string, string>>(map: M) {
  return Object.fromEntries(Object.entries(map).map(([k, v]) => [v, k])) as {
    [P in M[keyof M]]: keyof M & string;
  };
}

const RARITY_FROM_PRISMA = invert(RARITY_TO_PRISMA) as Record<PrismaCardRarity, CardRarity>;
const CONDITION_FROM_PRISMA = invert(CONDITION_TO_PRISMA) as Record<
  PrismaCardCondition,
  CardCondition
>;
const LANGUAGE_FROM_PRISMA = invert(LANGUAGE_TO_PRISMA) as Record<
  PrismaProductLanguage,
  ProductLanguage
>;

export function toPrismaCategory(value: ProductCategory): PrismaProductCategory {
  return CATEGORY_TO_PRISMA[value];
}

export function fromPrismaCategory(value: PrismaProductCategory): ProductCategory {
  return CATEGORY_FROM_PRISMA[value];
}

export function toPrismaSeries(value: ProductSeries): PrismaProductSeries {
  return SERIES_TO_PRISMA[value];
}

export function fromPrismaSeries(value: PrismaProductSeries): ProductSeries {
  return SERIES_FROM_PRISMA[value];
}

export function toPrismaSet(value: ProductSet): PrismaProductSet {
  return SET_TO_PRISMA[value];
}

export function fromPrismaSet(value: PrismaProductSet): ProductSet {
  return SET_FROM_PRISMA[value];
}

export function toPrismaRarity(value: CardRarity): PrismaCardRarity {
  return RARITY_TO_PRISMA[value];
}

export function fromPrismaRarity(value: PrismaCardRarity): CardRarity {
  return RARITY_FROM_PRISMA[value];
}

export function toPrismaCondition(value: CardCondition): PrismaCardCondition {
  return CONDITION_TO_PRISMA[value];
}

export function fromPrismaCondition(value: PrismaCardCondition): CardCondition {
  return CONDITION_FROM_PRISMA[value];
}

export function toPrismaLanguage(value: ProductLanguage): PrismaProductLanguage {
  return LANGUAGE_TO_PRISMA[value];
}

export function fromPrismaLanguage(value: PrismaProductLanguage): ProductLanguage {
  return LANGUAGE_FROM_PRISMA[value];
}

export { PrismaCardCondition, PrismaCardRarity, PrismaProductCategory, PrismaProductLanguage, PrismaProductSeries, PrismaProductSet };
