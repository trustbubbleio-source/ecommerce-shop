import { describe, expect, it, vi, beforeEach } from 'vitest';
import { api } from '@akknerds/api-client';
import { makeProduct } from '../test/utils';
import {
  ZETTLE_PRODUCT_CSV_HEADERS,
  fetchAllAdminProductsForZettleExport,
  formatZettlePriceSek,
  productToZettleCsvCells,
  productsToZettleCsv,
} from './zettle-products-csv';

describe('zettle-products-csv', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('matches the Zettle export column count and key headers', () => {
    expect(ZETTLE_PRODUCT_CSV_HEADERS[0]).toBe('Namn');
    expect(ZETTLE_PRODUCT_CSV_HEADERS[9]).toBe('SKU');
    expect(ZETTLE_PRODUCT_CSV_HEADERS[10]).toBe('Pris');
    expect(ZETTLE_PRODUCT_CSV_HEADERS[13]).toBe('I lager');
    expect(ZETTLE_PRODUCT_CSV_HEADERS[14]).toBe('Kategori');
    expect(ZETTLE_PRODUCT_CSV_HEADERS[15]).toBe('Variant id');
    expect(ZETTLE_PRODUCT_CSV_HEADERS[16]).toBe('Produkt id');
    expect(ZETTLE_PRODUCT_CSV_HEADERS).toHaveLength(18);
  });

  it('maps shop fields into the Zettle column order', () => {
    const product = makeProduct({
      name: 'Umbreon GX',
      category: 'graded-slab',
      price: 621_500,
      stock: 1,
      sku: 'GS-028',
      zettleVariantUuid: 'c055fc42-de95-11f1-a80a-190c558df2a7',
      zettleProductUuid: 'c055fc41-de95-11f1-a80a-190c558df2a7',
    });
    const cells = productToZettleCsvCells(product);
    expect(cells).toHaveLength(ZETTLE_PRODUCT_CSV_HEADERS.length);
    expect(cells[0]).toBe('Umbreon GX');
    expect(cells[2]).toBe('25');
    expect(cells[9]).toBe('GS-028');
    expect(cells[10]).toBe('6215');
    expect(cells[13]).toBe('1');
    expect(cells[14]).toBe('Graded Slabs');
    expect(cells[15]).toBe('c055fc42-de95-11f1-a80a-190c558df2a7');
    expect(cells[16]).toBe('c055fc41-de95-11f1-a80a-190c558df2a7');
    expect(cells[17]).toBe('');
  });

  it('formats fractional SEK prices with two decimals', () => {
    expect(formatZettlePriceSek(192_089)).toBe('1920.89');
  });

  it('builds a CSV with BOM + header + escaped names', () => {
    const csv = productsToZettleCsv([
      makeProduct({
        name: 'Mega, "Brave" Pack',
        sku: 'PK-1',
        price: 100_00,
        stock: 2,
      }),
    ]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain(ZETTLE_PRODUCT_CSV_HEADERS.join(','));
    expect(csv).toContain('"Mega, ""Brave"" Pack"');
    expect(csv).toContain(',PK-1,100,');
  });

  it('pages through adminListProducts until hasMore is false', async () => {
    const spy = vi.spyOn(api, 'adminListProducts').mockImplementation(async (query = {}) => {
      const offset = query.offset ?? 0;
      if (offset === 0) {
        return {
          products: [makeProduct({ id: 'a', name: 'A', sku: 'A-1' })],
          total: 2,
          limit: 50,
          offset: 0,
          hasMore: true,
          stats: { listings: 2, unitsInStock: 2, inventoryValueCents: 100 },
        };
      }
      return {
        products: [makeProduct({ id: 'b', name: 'B', sku: 'B-1' })],
        total: 2,
        limit: 50,
        offset: 1,
        hasMore: false,
        stats: { listings: 2, unitsInStock: 2, inventoryValueCents: 100 },
      };
    });

    const products = await fetchAllAdminProductsForZettleExport();
    expect(products.map((p) => p.id)).toEqual(['a', 'b']);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ limit: 50, offset: 0, sortKey: 'name' }),
    );
  });
});
