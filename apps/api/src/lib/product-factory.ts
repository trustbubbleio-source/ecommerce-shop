import { slugify, type CreateProductInput, type Product } from '@akknerds/shared';
import { nanoid } from 'nanoid';

/** Build a domain product from admin create input. */
export function newProductFromInput(input: CreateProductInput): Product {
  const id = `prod_${nanoid(10)}`;
  const slug = slugify(`${input.name}-${id}`);
  return {
    id,
    slug,
    name: input.name,
    description: input.description,
    category: input.category,
    set: input.set,
    series: input.series,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    currency: 'eur',
    images: input.images,
    image: input.images[0],
    accent: input.accent,
    stock: input.stock,
    featured: input.featured ?? false,
    isNew: input.isNew ?? true,
    rating: 0,
    reviewCount: 0,
    tags: input.tags ?? [],
    rarity: input.rarity,
    condition: input.condition,
    language: input.language,
    cardNumber: input.cardNumber,
    artist: input.artist,
    releaseDate: input.releaseDate,
  };
}

/** Merge admin input onto an existing product (keeps id, slug, ratings). */
export function applyProductInput(existing: Product, input: CreateProductInput): Product {
  return {
    ...existing,
    name: input.name,
    description: input.description,
    category: input.category,
    set: input.set,
    series: input.series,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    images: input.images,
    image: input.images[0],
    accent: input.accent,
    stock: input.stock,
    featured: input.featured ?? existing.featured,
    isNew: input.isNew ?? existing.isNew,
    tags: input.tags ?? existing.tags,
    rarity: input.rarity,
    condition: input.condition,
    language: input.language,
    cardNumber: input.cardNumber,
    artist: input.artist,
    releaseDate: input.releaseDate,
  };
}
