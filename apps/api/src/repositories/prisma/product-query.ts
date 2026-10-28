import {
  toPrismaCategory,
  toPrismaCondition,
  toPrismaLanguage,
  toPrismaSeries,
} from '@akknerds/db';
import type { ProductSeries, SortKey } from '@akknerds/shared';
import type { Prisma } from '@prisma/client';
import type { AdminProductSortKey, ListOptions } from '../interfaces.js';

/** Build a Prisma WHERE that mirrors `queryProducts` filters (plus featured/isNew). */
export function toProductWhere(
  options: ListOptions = {},
  searchIds?: string[] | null,
): Prisma.ProductWhereInput {
  const filter = options.filter ?? {};
  const and: Prisma.ProductWhereInput[] = [];

  if (filter.category && filter.category !== 'all') {
    // Domain uses kebab-case; Prisma client expects enum member keys (booster_box).
    and.push({ category: toPrismaCategory(filter.category) });
  }
  if (filter.series) {
    and.push({ series: toPrismaSeries(filter.series as ProductSeries) });
  }
  if (filter.inStockOnly) {
    and.push({ stock: { gt: 0 } });
  }
  if (filter.storeOnly !== undefined) {
    and.push({ storeOnly: filter.storeOnly });
  }
  if (filter.inactive !== undefined) {
    and.push({ inactive: filter.inactive });
  }
  if (filter.language) {
    and.push({ language: toPrismaLanguage(filter.language) });
  }
  if (filter.condition) {
    and.push({ condition: toPrismaCondition(filter.condition) });
  }
  if (typeof filter.minPrice === 'number' || typeof filter.maxPrice === 'number') {
    and.push({
      price: {
        ...(typeof filter.minPrice === 'number' ? { gte: filter.minPrice } : {}),
        ...(typeof filter.maxPrice === 'number' ? { lte: filter.maxPrice } : {}),
      },
    });
  }
  if (options.featured !== undefined) {
    and.push({ featured: options.featured });
  }
  if (options.isNew !== undefined) {
    and.push({ isNew: options.isNew });
  }
  if (searchIds) {
    and.push({ id: { in: searchIds } });
  }

  return and.length > 0 ? { AND: and } : {};
}

function shopOrderBy(sort: SortKey | undefined): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort ?? 'featured') {
    case 'newest':
      return [{ releaseDate: 'desc' }, { name: 'asc' }];
    case 'price-asc':
      return [{ price: 'asc' }, { name: 'asc' }];
    case 'price-desc':
      return [{ price: 'desc' }, { name: 'asc' }];
    case 'name-asc':
      return [{ name: 'asc' }];
    case 'rating':
      return [{ rating: 'desc' }, { reviewCount: 'desc' }, { name: 'asc' }];
    case 'featured':
    default:
      return [{ featured: 'desc' }, { rating: 'desc' }, { name: 'asc' }];
  }
}

function adminOrderBy(
  key: AdminProductSortKey,
  dir: 'asc' | 'desc',
): Prisma.ProductOrderByWithRelationInput[] {
  switch (key) {
    case 'name':
      return [{ name: dir }];
    case 'category':
      return [{ category: dir }, { name: 'asc' }];
    case 'price':
      return [{ price: dir }, { name: 'asc' }];
    case 'stock':
      return [{ stock: dir }, { name: 'asc' }];
    case 'status':
      // Composite (out/featured/new) — caller falls back to in-memory sort.
      return [{ name: 'asc' }];
  }
}

export function toProductOrderBy(options: ListOptions = {}): Prisma.ProductOrderByWithRelationInput[] {
  if (options.adminSort) {
    return adminOrderBy(options.adminSort.key, options.adminSort.dir);
  }
  return shopOrderBy(options.sort);
}

/** True when SQL cannot mirror the shared sorter (admin status). */
export function needsInMemoryProductPage(options: ListOptions = {}): boolean {
  return options.adminSort?.key === 'status';
}
