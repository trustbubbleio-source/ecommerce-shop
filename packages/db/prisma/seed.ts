import { PRODUCTS } from '@akknerds/shared';
import { fromProduct } from '../src/mappers.js';
import { prisma } from '../src/client.js';

async function main() {
  for (const product of PRODUCTS) {
    await prisma.product.upsert({
      where: { id: product.id },
      create: fromProduct(product),
      update: fromProduct(product),
    });
  }
  console.info(`[db:seed] Upserted ${PRODUCTS.length} products`);
}

main()
  .catch((error) => {
    console.error('[db:seed] Failed', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
