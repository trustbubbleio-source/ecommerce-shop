/**
 * Link shop products to PayPal Zettle library rows from an export xlsx.
 *
 * Matching:
 * 1) SKU === product.id (legacy prod_* SKUs)
 * 2) Exact normalized name (unique)
 * 3) Fuzzy name (strip language tags / punctuation) when unique
 *
 * Also writes sku, zettle UUIDs, and syncs price (SEK→öre) + stock from Zettle.
 *
 * Usage:
 *   pnpm --filter @akknerds/db exec dotenv -e ../../.env -- tsx scripts/link-zettle-export.ts ../../export_2026-11-13.xlsx
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const require = createRequire(import.meta.url);

type ExportRow = {
  name: string | null;
  sku: string;
  priceSek: number;
  stock: number;
  productUuid: string;
  variantUuid: string;
};

const NAME_NOISE =
  /boosterpacks?|boosterboxes?|elitetrainerboxes?|collectionboxes?|sleeved|blisters?|etb|packs?|boxes?/g;

function norm(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, '');
}

/** Stronger key: drop pack/box/etb noise so "Mega Brave (JP)" ≈ "Mega Brave Booster Pack". */
function stem(value: string | null | undefined): string {
  return norm(value).replace(NAME_NOISE, '');
}

function uniqueMatch<T>(candidates: T[]): T | undefined {
  return candidates.length === 1 ? candidates[0] : undefined;
}

function loadExport(filePath: string): ExportRow[] {
  const XLSX = require('xlsx') as typeof import('xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  return raw
    .map((row) => {
      const sku = String(row['SKU'] ?? '').trim();
      const productUuid = String(row['Produkt id'] ?? '').trim();
      const variantUuid = String(row['Variant id'] ?? '').trim();
      if (!sku || !productUuid || !variantUuid) return null;
      const priceSek = Number(row['Pris'] ?? 0);
      const stock = Number(row['I lager'] ?? 0);
      return {
        name: row['Namn'] == null ? null : String(row['Namn']),
        sku,
        priceSek: Number.isFinite(priceSek) ? priceSek : 0,
        stock: Number.isFinite(stock) ? Math.max(0, Math.round(stock)) : 0,
        productUuid,
        variantUuid,
      } satisfies ExportRow;
    })
    .filter((row): row is ExportRow => Boolean(row));
}

async function main() {
  const fileArg = process.argv[2] ?? '../../export_2026-11-13.xlsx';
  const filePath = path.resolve(process.cwd(), fileArg);
  const rows = loadExport(filePath);
  const prisma = new PrismaClient();

  const products = await prisma.product.findMany({
    select: { id: true, name: true, category: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const byName = new Map<string, typeof products>();
  const byStem = new Map<string, typeof products>();
  for (const product of products) {
    const key = norm(product.name);
    const list = byName.get(key) ?? [];
    list.push(product);
    byName.set(key, list);

    const stemKey = stem(product.name);
    if (stemKey) {
      const stemList = byStem.get(stemKey) ?? [];
      stemList.push(product);
      byStem.set(stemKey, stemList);
    }
  }

  let linked = 0;
  let skipped = 0;
  const unmatched: string[] = [];

  for (const row of rows) {
    let match = byId.get(row.sku);
    let how = 'id';

    if (!match && row.name) {
      const exact = byName.get(norm(row.name)) ?? [];
      match = uniqueMatch(exact);
      if (match) how = 'name';

      if (!match && exact.length > 1 && row.sku.startsWith('GS-')) {
        const graded = exact.filter((p) => p.category === 'graded_slab' || String(p.category) === 'graded-slab');
        // Prisma enum may be graded_slab
        const gradedAlt = exact.filter((p) => String(p.category).toLowerCase().includes('graded'));
        const pool = graded.length === 1 ? graded : gradedAlt.length === 1 ? gradedAlt : [];
        if (pool.length === 1) {
          match = pool[0];
          how = 'name+graded';
        }
      }
    }

    if (!match && row.name) {
      const stemExact = byStem.get(stem(row.name)) ?? [];
      match = uniqueMatch(stemExact);
      if (match) how = 'stem';
    }

    // Unique prefix/contains fallback (e.g. short Zettle titles).
    if (!match && row.name) {
      const rowStem = stem(row.name);
      if (rowStem.length >= 6) {
        const loose = products.filter((p) => {
          const pStem = stem(p.name);
          return pStem === rowStem || pStem.startsWith(rowStem) || rowStem.startsWith(pStem);
        });
        match = uniqueMatch(loose);
        if (match) how = 'stem-loose';
      }
    }

    // Special-case drinks / shortened Zettle names
    if (!match && row.sku.startsWith('GOWELL')) {
      match = products.find((p) => norm(p.name).includes('gowell')) ?? undefined;
      how = 'gowell';
    }

    if (!match) {
      skipped += 1;
      unmatched.push(`${row.sku} | ${row.name ?? '(variant)'} | ${row.productUuid}`);
      continue;
    }

    const priceOre = Math.round(row.priceSek * 100);
    await prisma.product.update({
      where: { id: match.id },
      data: {
        sku: row.sku,
        zettleProductUuid: row.productUuid,
        zettleVariantUuid: row.variantUuid,
        price: priceOre,
        stock: row.stock,
      },
    });
    linked += 1;
    console.log(`linked ${how}: ${match.id} <- ${row.sku}`);
  }

  console.log(`\nDone. linked=${linked} skipped=${skipped} exportRows=${rows.length}`);
  if (unmatched.length) {
    console.log('\nUnmatched:');
    for (const line of unmatched) console.log(`  ${line}`);
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  process.exitCode = 1;
});
