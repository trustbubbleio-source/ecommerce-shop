import {
  type CardCondition,
  type CardRarity,
  type CreateProductInput,
  conditionLabel,
  isCardStyleCategory,
  rarityLabel,
  type ProductCategory,
  type ProductLanguage,
  type ProductSeries,
  type ProductSet,
  type ProductTag,
} from '@akknerds/shared';

export interface ImageDraft {
  previewUrl: string;
  file?: File;
  s3Key?: string;
}

export const PRODUCT_NAME_GUIDE: Record<ProductCategory, { hint: string; placeholder: string }> = {
  'single-card': {
    hint: 'Card title on the product page — include Pokémon, set and rarity if you like.',
    placeholder: 'Charizard ex — 151 (Special Illustration Rare)',
  },
  'graded-slab': {
    hint: 'Slab title — include Pokémon, grading company and score.',
    placeholder: 'Charizard ex PSA 10 — Phantasmal Flames',
  },
  'booster-box': {
    hint: 'Full product title customers see on the detail page.',
    placeholder: 'Pokémon 151 Booster Box',
  },
  'elite-trainer-box': {
    hint: 'Full product title customers see on the detail page.',
    placeholder: 'Pokémon 151 Elite Trainer Box',
  },
  'booster-pack': {
    hint: 'Full product title customers see on the detail page.',
    placeholder: 'Pokémon 151 Booster Pack',
  },
  bundle: {
    hint: 'Name of the bundle as shown on the product page.',
    placeholder: '151 Booster Bundle (6 packs)',
  },
  accessory: {
    hint: 'Product name as shown on the product page.',
    placeholder: 'Ultra Pro Eclipse Deck Box',
  },
};

export type ProductFormValues = {
  name: string;
  description: string;
  category: ProductCategory;
  series: ProductSeries | '';
  set: ProductSet | '';
  price: string;
  stock: string;
  accent: string;
  releaseDate: string;
  cardNumber: string;
  artist: string;
  rarity: CardRarity | '';
  condition: CardCondition | '';
  language: ProductLanguage;
  tags: ProductTag[];
  featured: boolean;
  isNew: boolean;
};

export const defaultProductFormValues: ProductFormValues = {
  name: '',
  description: '',
  category: 'booster-pack',
  series: '',
  set: '',
  price: '',
  stock: '10',
  accent: '#a855f7',
  releaseDate: new Date().toISOString().slice(0, 10),
  cardNumber: '',
  artist: '',
  rarity: '',
  condition: '',
  language: 'english',
  tags: [],
  featured: false,
  isNew: true,
};

/** Standard single-card listing copy — headline uses name, rarity and condition. */
export function buildSingleCardDescription(input: {
  name: string;
  rarity: CardRarity;
  condition: CardCondition;
}): string {
  const headline = `${input.name.trim()} (${rarityLabel(input.rarity)}) ${conditionLabel(input.condition)}`;

  return `${headline}

Pack fresh and carefully handled from the moment it was pulled — transferred directly from the booster pack into a protective sleeve and toploader. Stored with care to preserve its condition.

The card appears to be in excellent condition with strong centering and minimal handling. Please refer to the photos for the exact card you will receive.`;
}

export function buildGradedSlabDescription(input: {
  name: string;
  condition: CardCondition;
}): string {
  const headline = `${input.name.trim()} — graded slab (${conditionLabel(input.condition)})`;

  return `${headline}

Professionally graded and sealed in a protective case. Stored in a climate-controlled environment away from direct light.

Please refer to the photos for the exact slab you will receive, including the label, grade and any certification details visible on the case.`;
}

export function cardListingDescriptionFor(values: ProductFormValues): string | undefined {
  if (!isCardStyleCategory(values.category)) return undefined;
  if (!values.name.trim() || !values.condition) return undefined;
  if (values.category === 'graded-slab') {
    return buildGradedSlabDescription({
      name: values.name,
      condition: values.condition,
    });
  }
  if (!values.rarity) return undefined;
  return buildSingleCardDescription({
    name: values.name,
    rarity: values.rarity,
    condition: values.condition,
  });
}

/** @deprecated Use cardListingDescriptionFor */
export function singleCardDescriptionFor(values: ProductFormValues): string | undefined {
  return cardListingDescriptionFor(values);
}

export function buildProductDraft(
  values: ProductFormValues,
  imageCount: number,
): CreateProductInput {
  const price = Number.parseFloat(values.price);
  const stock = Number.parseInt(values.stock, 10);
  return {
    name: values.name,
    description: values.description,
    category: values.category,
    series: values.series as ProductSeries,
    set: values.set as ProductSet,
    price: Number.isFinite(price) ? Math.round(price * 100) : 0,
    stock: Number.isFinite(stock) ? stock : -1,
    accent: values.accent,
    images: imageCount > 0 ? Array.from({ length: imageCount }, () => 'pending') : [],
    isNew: values.isNew,
    featured: values.featured,
    releaseDate: values.releaseDate,
    cardNumber: values.cardNumber.trim() || undefined,
    artist: values.artist.trim() || undefined,
    rarity: values.rarity as CardRarity,
    condition: values.condition as CardCondition,
    language: values.language,
    tags: values.tags.length > 0 ? values.tags : undefined,
  };
}

export async function collectImageKeys(
  images: ImageDraft[],
  upload: (files: File[]) => Promise<{ keys: string[] }>,
): Promise<string[]> {
  const keys: string[] = [];
  const filesToUpload: File[] = [];
  for (const image of images) {
    if (image.s3Key) keys.push(image.s3Key);
    else if (image.file) filesToUpload.push(image.file);
  }
  if (filesToUpload.length > 0) {
    const result = await upload(filesToUpload);
    keys.push(...result.keys);
  }
  return keys;
}
