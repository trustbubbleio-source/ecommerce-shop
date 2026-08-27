import { categoryLabel, queryProducts, type Product } from '@akknerds/shared';
import type { AdminProductSortKey, ListOptions, ProductPage } from './interfaces.js';

function statusSortKey(product: Product): string {
  const parts: string[] = [];
  if (product.stock <= 0) parts.push('out');
  if (product.featured) parts.push('featured');
  if (product.isNew) parts.push('new');
  return parts.join(',') || 'active';
}

export function compareAdminProducts(
  a: Product,
  b: Product,
  key: AdminProductSortKey,
  dir: 'asc' | 'desc',
): number {
  let cmp = 0;
  switch (key) {
    case 'name':
      cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      break;
    case 'category':
      cmp = categoryLabel(a.category).localeCompare(categoryLabel(b.category), undefined, {
        sensitivity: 'base',
      });
      break;
    case 'price':
      cmp = a.price - b.price;
      break;
    case 'stock':
      cmp = a.stock - b.stock;
      break;
    case 'status':
      cmp = statusSortKey(a).localeCompare(statusSortKey(b), undefined, { sensitivity: 'base' });
      break;
  }
  return dir === 'asc' ? cmp : -cmp;
}

/** Filter + sort, then apply optional limit/offset. `total` is the count before paging. */
export function pageProducts(products: Product[], options: ListOptions = {}): ProductPage {
  let result = queryProducts(products, {
    filter: options.filter,
    sort: options.adminSort ? 'name-asc' : options.sort,
  });
  if (options.featured !== undefined) {
    result = result.filter((p) => p.featured === options.featured);
  }
  if (options.isNew !== undefined) {
    result = result.filter((p) => p.isNew === options.isNew);
  }
  if (options.adminSort) {
    const { key, dir } = options.adminSort;
    result = [...result].sort((a, b) => compareAdminProducts(a, b, key, dir));
  }

  const total = result.length;
  const offset = Math.max(0, options.offset ?? 0);

  if (typeof options.limit === 'number') {
    const limit = Math.max(0, options.limit);
    result = result.slice(offset, offset + limit);
  } else if (offset > 0) {
    result = result.slice(offset);
  }

  return { products: result, total };
}
