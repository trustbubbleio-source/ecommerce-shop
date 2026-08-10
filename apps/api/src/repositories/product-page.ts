import type { Product } from '@akknerds/shared';
import { queryProducts } from '@akknerds/shared';
import type { ListOptions, ProductPage } from './interfaces.js';

/** Filter + sort, then apply optional limit/offset. `total` is the count before paging. */
export function pageProducts(products: Product[], options: ListOptions = {}): ProductPage {
  let result = queryProducts(products, { filter: options.filter, sort: options.sort });
  if (options.featured !== undefined) {
    result = result.filter((p) => p.featured === options.featured);
  }
  if (options.isNew !== undefined) {
    result = result.filter((p) => p.isNew === options.isNew);
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
