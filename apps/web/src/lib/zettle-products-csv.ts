import { categoryLabel, type Product } from '@akknerds/shared';
import { api } from '@akknerds/api-client';

/**
 * Exact PayPal Zettle library export headers (Swedish UI).
 * Keep in sync with Zettle → Products → Export (.xlsx / .csv).
 */
export const ZETTLE_PRODUCT_CSV_HEADERS = [
  'Namn',
  'Annan enhet',
  'Moms',
  'Namn alt. 1',
  'Värde alt. 1',
  'Namn alt. 2',
  'Värde alt. 2',
  'Namn alt. 3',
  'Värde alt. 3',
  'SKU',
  'Pris',
  'Inköpspris',
  'Streckkod',
  'I lager',
  'Kategori',
  'Variant id',
  'Produkt id',
  'ID (ändra inte detta): [n-un-vat-vo0n-vo0v-vo1n-vo1v-vo2n-vo2v-sku-p-cp-bc-ib-cat-vid-id-k]',
] as const;

const EXPORT_PAGE_SIZE = 50;

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** SEK amount as Zettle writes it (öre → kronor). */
export function formatZettlePriceSek(ore: number): string {
  const sek = ore / 100;
  return Number.isInteger(sek) ? String(sek) : sek.toFixed(2);
}

/**
 * Map one shop product to a Zettle-shaped row.
 * Empty cells match fields we do not store (unit, variants, cost, barcode, Zettle row id).
 * Moms defaults to 25 (standard Swedish VAT) — adjust in Zettle if a line differs.
 */
export function productToZettleCsvCells(product: Product): string[] {
  return [
    product.name,
    '',
    '25',
    '',
    '',
    '',
    '',
    '',
    '',
    product.sku ?? '',
    formatZettlePriceSek(product.price),
    '',
    '',
    String(product.stock),
    categoryLabel(product.category),
    product.zettleVariantUuid ?? '',
    product.zettleProductUuid ?? '',
    '',
  ];
}

/** Active catalog only — deactivated products stay out of POS compare exports. */
export function filterProductsForZettleExport(products: Product[]): Product[] {
  return products.filter((product) => !product.inactive);
}

export function productsToZettleCsv(products: Product[]): string {
  const rows = [ZETTLE_PRODUCT_CSV_HEADERS.join(',')];
  for (const product of filterProductsForZettleExport(products)) {
    rows.push(productToZettleCsvCells(product).map(csvEscape).join(','));
  }
  // UTF-8 BOM so Excel keeps å/ä/ö when opening the CSV.
  return `\uFEFF${rows.join('\n')}\n`;
}

/** Pull the admin catalog for a Zettle-shaped export (excludes inactive). */
export async function fetchAllAdminProductsForZettleExport(): Promise<Product[]> {
  const all: Product[] = [];
  let offset = 0;
  for (;;) {
    const page = await api.adminListProducts({
      limit: EXPORT_PAGE_SIZE,
      offset,
      sortKey: 'name',
      sortDir: 'asc',
    });
    all.push(...page.products);
    if (!page.hasMore || page.products.length === 0) break;
    offset += page.products.length;
  }
  return filterProductsForZettleExport(all);
}

export function downloadZettleProductsCsv(
  products: Product[],
  filename = defaultZettleExportFilename(),
): void {
  const blob = new Blob([productsToZettleCsv(products)], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function defaultZettleExportFilename(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `onemorerip-zettle-products-${y}-${m}-${d}.csv`;
}
