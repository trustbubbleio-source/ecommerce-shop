import type { Product } from './types.js';

export interface CatalogStats {
  listings: number;
  unitsInStock: number;
  inventoryValueCents: number;
}

/** Sum catalog metrics from the full product list (prices are integer cents). */
export function computeCatalogStats(products: Product[]): CatalogStats {
  return products.reduce(
    (acc, product) => {
      const units = Math.max(0, product.stock);
      return {
        listings: acc.listings + 1,
        unitsInStock: acc.unitsInStock + units,
        inventoryValueCents: acc.inventoryValueCents + product.price * units,
      };
    },
    { listings: 0, unitsInStock: 0, inventoryValueCents: 0 },
  );
}
