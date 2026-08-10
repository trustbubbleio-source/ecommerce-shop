import { config } from 'dotenv';
import { disconnectDb, fromProduct, prisma, toProduct } from '@akknerds/db';
import { syncSingleCardPrices } from '../src/sync-catalog.js';

config({ path: new URL('../../../.env', import.meta.url) });

const dryRun = process.argv.includes('--dry-run');
const delayArg = process.argv.find((arg) => arg.startsWith('--delay='));
const delayMs = delayArg ? Number.parseInt(delayArg.split('=')[1] ?? '', 10) : 750;

async function main() {
  const rows = await prisma.product.findMany();
  const products = rows.map(toProduct);

  console.log(
    `Syncing prices for ${products.filter((product) => product.category === 'single-card').length} single-card products…`,
  );
  if (dryRun) console.log('(dry run — no database writes)');

  const outcomes = await syncSingleCardPrices(products, {
    delayMs,
    onUpdate: async (product, priceCents) => {
      if (dryRun) return;
      const updated = { ...product, price: priceCents };
      await prisma.product.update({
        where: { id: product.id },
        data: fromProduct(updated),
      });
    },
  });

  const updated = outcomes.filter((outcome) => outcome.status === 'updated').length;
  const skipped = outcomes.filter((outcome) => outcome.status === 'skipped').length;
  const errors = outcomes.filter((outcome) => outcome.status === 'error').length;

  console.log(`Done: ${updated} updated, ${skipped} skipped, ${errors} errors`);
  for (const outcome of outcomes) {
    if (outcome.status === 'error') {
      console.log(`  ✗ ${outcome.productName}: ${outcome.message}`);
    } else if (outcome.status === 'updated') {
      console.log(`  ✓ ${outcome.productName}: ${(outcome.priceCents ?? 0) / 100}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDb();
  });
