import { describe, expect, it } from 'vitest';
import {
  FLAT_SHIPPING_FEE,
  FREE_SHIPPING_THRESHOLD,
  VAT_PERCENT,
  calcShipping,
  calcSubtotal,
  hasCarrierTracking,
  priceCart,
  vatIncludedIn,
} from './pricing.js';
import type { Product } from './types.js';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    slug: 'p1',
    name: 'Test Product',
    description: 'desc',
    category: 'booster-pack',
    set: 'Test',
    series: 'Test',
    price: 1000,
    currency: 'sek',
    accent: '#fff',
    stock: 10,
    featured: false,
    isNew: false,
    storeOnly: false,
    inactive: false,
    rating: 4,
    reviewCount: 1,
    tags: [],
    releaseDate: '2024-01-01',
    ...overrides,
  };
}

describe('calcShipping', () => {
  it('is free for an empty/zero subtotal', () => {
    expect(calcShipping(0)).toBe(0);
    expect(calcShipping(-100)).toBe(0);
  });

  it('charges a flat fee below the threshold', () => {
    expect(calcShipping(FREE_SHIPPING_THRESHOLD - 1)).toBe(FLAT_SHIPPING_FEE);
    expect(calcShipping(100)).toBe(FLAT_SHIPPING_FEE);
  });

  it('is free at or above the threshold', () => {
    expect(calcShipping(FREE_SHIPPING_THRESHOLD)).toBe(0);
    expect(calcShipping(FREE_SHIPPING_THRESHOLD + 5000)).toBe(0);
  });
});

describe('hasCarrierTracking', () => {
  it('is included at the free-shipping subtotal', () => {
    expect(hasCarrierTracking(FREE_SHIPPING_THRESHOLD - 1)).toBe(false);
    expect(hasCarrierTracking(FREE_SHIPPING_THRESHOLD)).toBe(true);
  });
});

describe('vatIncludedIn', () => {
  it('extracts 25% VAT from a VAT-inclusive amount', () => {
    expect(VAT_PERCENT).toBe(25);
    expect(vatIncludedIn(75_000)).toBe(15_000);
    expect(vatIncludedIn(0)).toBe(0);
  });
});

describe('calcSubtotal', () => {
  it('sums unit price times quantity', () => {
    expect(
      calcSubtotal([
        { unitPrice: 1000, quantity: 2 },
        { unitPrice: 500, quantity: 3 },
      ]),
    ).toBe(3500);
  });

  it('is 0 for no lines', () => {
    expect(calcSubtotal([])).toBe(0);
  });
});

describe('priceCart', () => {
  const products = [
    makeProduct({ id: 'a', price: 20_000, stock: 5 }),
    makeProduct({ id: 'b', price: 50_000, stock: 1 }),
    makeProduct({ id: 'c', price: 999, stock: 0 }),
  ];
  const lookup = (id: string) => products.find((p) => p.id === id);

  it('re-prices from the catalog and ignores client prices', () => {
    const result = priceCart([{ productId: 'a', quantity: 2 }], lookup);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]).toMatchObject({ productId: 'a', unitPrice: 20_000, quantity: 2 });
    expect(result.subtotal).toBe(40_000);
    expect(result.currency).toBe('sek');
  });

  it('always prices in SEK even when another currency is requested', () => {
    const result = priceCart([{ productId: 'a', quantity: 1 }], lookup, 'eur');
    expect(result.currency).toBe('sek');
    expect(result.lines[0]?.unitPrice).toBe(20_000);
  });

  it('clamps quantity to available stock', () => {
    const result = priceCart([{ productId: 'b', quantity: 9 }], lookup);
    expect(result.lines[0]?.quantity).toBe(1);
    expect(result.subtotal).toBe(50_000);
  });

  it('drops unknown and out-of-stock products', () => {
    const result = priceCart(
      [
        { productId: 'missing', quantity: 1 },
        { productId: 'c', quantity: 1 },
        { productId: 'a', quantity: 1 },
      ],
      lookup,
    );
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]?.productId).toBe('a');
  });

  it('drops store-only and inactive products from online checkout', () => {
    const catalog = [
      makeProduct({ id: 'a', price: 20_000, stock: 5 }),
      makeProduct({ id: 'store', price: 9_999, stock: 3, storeOnly: true }),
      makeProduct({ id: 'off', price: 5_000, stock: 2, inactive: true }),
    ];
    const byId = (id: string) => catalog.find((p) => p.id === id);
    const result = priceCart(
      [
        { productId: 'store', quantity: 1 },
        { productId: 'off', quantity: 1 },
        { productId: 'a', quantity: 1 },
      ],
      byId,
    );
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]?.productId).toBe('a');
  });

  it('floors and floors-to-minimum fractional/low quantities', () => {
    const result = priceCart([{ productId: 'a', quantity: 2.9 }], lookup);
    expect(result.lines[0]?.quantity).toBe(2);
  });

  it('adds shipping below the free threshold and totals correctly', () => {
    const result = priceCart([{ productId: 'a', quantity: 1 }], lookup);
    expect(result.shipping).toBe(FLAT_SHIPPING_FEE);
    expect(result.discount).toBe(0);
    expect(result.total).toBe(result.subtotal + result.shipping - result.discount);
  });

  it('gives free shipping for a large order', () => {
    const result = priceCart([{ productId: 'a', quantity: 5 }], lookup);
    expect(result.subtotal).toBe(100_000);
    expect(result.shipping).toBe(0);
    expect(result.total).toBe(100_000);
  });

  it('applies a percent discount code', () => {
    const result = priceCart([{ productId: 'a', quantity: 5 }], lookup, 'sek', 'ONEMORERIP10');
    expect(result.discount).toBe(10_000);
    expect(result.discountCode).toBe('ONEMORERIP10');
    expect(result.total).toBe(90_000);
  });

  it('returns an empty priced cart for no valid items', () => {
    const result = priceCart([], lookup);
    expect(result.lines).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.shipping).toBe(0);
  });
});
