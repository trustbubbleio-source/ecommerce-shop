import type {
  Address,
  Order,
  OrderLine,
  OrderStatus,
  Product,
} from '@akknerds/shared';
import { BASE_CURRENCY, primaryProductImage } from '@akknerds/shared';
import type { Order as DbOrder, Product as DbProduct } from '@prisma/client';
import {
  fromPrismaCategory,
  fromPrismaCondition,
  fromPrismaLanguage,
  fromPrismaRarity,
  fromPrismaSeries,
  fromPrismaSet,
  toPrismaCategory,
  toPrismaCondition,
  toPrismaLanguage,
  toPrismaRarity,
  toPrismaSeries,
  toPrismaSet,
} from './enum-mappers.js';

function catalogCurrency(value: string): string {
  // Legacy rows may still say "usd"; catalog amounts are treated as EUR.
  return value.toLowerCase() === 'usd' ? BASE_CURRENCY : value.toLowerCase();
}

export function toProduct(row: DbProduct): Product {
  const images =
    row.images.length > 0 ? row.images : row.image ? [row.image] : [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: fromPrismaCategory(row.category),
    set: fromPrismaSet(row.setName),
    series: fromPrismaSeries(row.series),
    price: row.price,
    compareAtPrice: row.compareAtPrice ?? undefined,
    currency: catalogCurrency(row.currency),
    images,
    image: primaryProductImage({ images, image: row.image ?? undefined }),
    accent: row.accent,
    stock: row.stock,
    featured: row.featured,
    isNew: row.isNew,
    rating: row.rating,
    reviewCount: row.reviewCount,
    tags: row.tags,
    rarity: row.rarity ? fromPrismaRarity(row.rarity) : undefined,
    condition: row.condition ? fromPrismaCondition(row.condition) : undefined,
    language: fromPrismaLanguage(row.language),
    cardNumber: row.cardNumber ?? undefined,
    releaseDate: row.releaseDate,
  };
}

export function fromProduct(product: Product) {
  const images = product.images.length
    ? product.images
    : product.image
      ? [product.image]
      : [];
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    category: toPrismaCategory(product.category),
    setName: toPrismaSet(product.set),
    series: toPrismaSeries(product.series),
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    currency: product.currency === 'usd' ? BASE_CURRENCY : product.currency,
    image: images[0] ?? null,
    images,
    accent: product.accent,
    stock: product.stock,
    featured: product.featured,
    isNew: product.isNew,
    rating: product.rating,
    reviewCount: product.reviewCount,
    tags: product.tags,
    rarity: product.rarity ? toPrismaRarity(product.rarity) : null,
    condition: product.condition ? toPrismaCondition(product.condition) : null,
    language: toPrismaLanguage(product.language),
    cardNumber: product.cardNumber ?? null,
    releaseDate: product.releaseDate,
  };
}

export function toOrder(row: DbOrder): Order {
  return {
    id: row.id,
    userId: row.userId ?? undefined,
    email: row.email,
    lines: row.lines as unknown as OrderLine[],
    subtotal: row.subtotal,
    shipping: row.shipping,
    total: row.total,
    currency: row.currency,
    status: row.status as OrderStatus,
    stripeSessionId: row.stripeSessionId ?? undefined,
    shippingAddress: (row.shippingAddress as unknown as Address | null) ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}
