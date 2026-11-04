import type { AdminOrder, AdminOrderLineProduct, Order, Product } from '@akknerds/shared';
import type { ProductRepository } from '../repositories/interfaces.js';

function packingSnapshot(product: Product): AdminOrderLineProduct {
  return {
    slug: product.slug,
    category: product.category,
    set: product.set,
    series: product.series,
    language: product.language,
    images: product.images,
    image: product.image,
    accent: product.accent,
    cardNumber: product.cardNumber,
    rarity: product.rarity,
    condition: product.condition,
  };
}

/** Attach catalogue details to each line so admins can pack without guessing. */
export async function enrichOrderForPacking(
  products: ProductRepository,
  order: Order,
): Promise<AdminOrder> {
  const lines = await Promise.all(
    order.lines.map(async (line) => {
      const product = await products.getByIdOrSlug(line.productId);
      return {
        ...line,
        product: product ? packingSnapshot(product) : null,
      };
    }),
  );
  return { ...order, lines };
}
