import { beforeEach, describe, expect, it } from 'vitest';
import {
  type CartProduct,
  cartCount,
  cartShipping,
  cartSubtotal,
  cartTotal,
  toCartProduct,
  useCartStore,
} from './cart';
import { makeProduct } from '../test/utils';

function product(overrides: Partial<CartProduct> = {}): CartProduct {
  return {
    id: 'p1',
    slug: 'p1',
    name: 'Test',
    price: 1000,
    accent: '#fff',
    category: 'booster-pack',
    set: '151',
    series: 'Scarlet & Violet',
    currency: 'eur',
    stock: 5,
    ...overrides,
  };
}

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe('cart store', () => {
  it('adds a product', () => {
    useCartStore.getState().add(product());
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]!.quantity).toBe(1);
  });

  it('merges quantity when adding the same product', () => {
    const p = product();
    useCartStore.getState().add(p, 2);
    useCartStore.getState().add(p, 2);
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0]!.quantity).toBe(4);
  });

  it('clamps quantity to available stock', () => {
    useCartStore.getState().add(product({ stock: 3 }), 10);
    expect(useCartStore.getState().items[0]!.quantity).toBe(3);
  });

  it('updates quantity and removes when set below 1', () => {
    const p = product();
    useCartStore.getState().add(p);
    useCartStore.getState().setQuantity('p1', 3);
    expect(useCartStore.getState().items[0]!.quantity).toBe(3);
    useCartStore.getState().setQuantity('p1', 0);
    expect(useCartStore.getState().items[0]!.quantity).toBe(1); // clamped to min 1
  });

  it('removes a product', () => {
    useCartStore.getState().add(product());
    useCartStore.getState().remove('p1');
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('clears the cart', () => {
    useCartStore.getState().add(product());
    useCartStore.getState().add(product({ id: 'p2', slug: 'p2' }));
    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe('cart selectors', () => {
  const items = [
    { product: product({ id: 'a', price: 2000 }), quantity: 2 },
    { product: product({ id: 'b', price: 1000 }), quantity: 1 },
  ];

  it('counts total items', () => {
    expect(cartCount(items)).toBe(3);
  });

  it('computes subtotal', () => {
    expect(cartSubtotal(items)).toBe(5000);
  });

  it('adds shipping below the free threshold', () => {
    expect(cartShipping(items)).toBe(599);
    expect(cartTotal(items)).toBe(5599);
  });

  it('gives free shipping above the threshold', () => {
    const big = [{ product: product({ id: 'x', price: 9000 }), quantity: 1 }];
    expect(cartShipping(big)).toBe(0);
    expect(cartTotal(big)).toBe(9000);
  });
});

describe('toCartProduct', () => {
  it('extracts a compact snapshot from a full product', () => {
    const snapshot = toCartProduct(makeProduct());
    expect(snapshot).toMatchObject({ id: 'bb-151', series: 'Scarlet & Violet' });
    expect(snapshot).not.toHaveProperty('description');
  });
});
