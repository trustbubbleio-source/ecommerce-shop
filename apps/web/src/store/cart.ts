import { type Product, calcShipping, calcSubtotal } from '@akknerds/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Lightweight product snapshot stored in the cart (kept small for localStorage). */
export type CartProduct = Pick<
  Product,
  | 'id'
  | 'slug'
  | 'name'
  | 'price'
  | 'accent'
  | 'category'
  | 'set'
  | 'series'
  | 'image'
  | 'currency'
  | 'stock'
>;

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  add: (product: CartProduct, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const clampToStock = (quantity: number, stock: number) => Math.max(1, Math.min(stock, quantity));

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((item) => item.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: clampToStock(item.quantity + quantity, product.stock) }
                  : item,
              ),
            };
          }
          return {
            items: [...state.items, { product, quantity: clampToStock(quantity, product.stock) }],
          };
        }),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((item) => item.product.id !== productId) })),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.product.id === productId
                ? { ...item, quantity: clampToStock(quantity, item.product.stock) }
                : item,
            )
            .filter((item) => item.quantity > 0),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: 'akknerds-cart' },
  ),
);

// ── Pure selectors (testable without React) ───────────────────────────
export function toCartProduct(product: Product): CartProduct {
  const { id, slug, name, price, accent, category, set, series, image, currency, stock } = product;
  return { id, slug, name, price, accent, category, set, series, image, currency, stock };
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function cartSubtotal(items: CartItem[]): number {
  return calcSubtotal(
    items.map((item) => ({ unitPrice: item.product.price, quantity: item.quantity })),
  );
}

export function cartShipping(items: CartItem[]): number {
  return calcShipping(cartSubtotal(items));
}

export function cartTotal(items: CartItem[]): number {
  return cartSubtotal(items) + cartShipping(items);
}
