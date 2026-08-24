import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { type CartProduct, useCartStore } from '../store/cart';
import { renderApp } from '../test/utils';

function cartProduct(): CartProduct {
  return {
    id: 'p1',
    slug: 'p1',
    name: 'Obsidian Box',
    price: 2000,
    accent: '#fff',
    category: 'booster-box',
    set: '151',
    series: 'Scarlet & Violet',
    currency: 'eur',
    stock: 5,
  };
}

beforeEach(() => useCartStore.setState({ items: [] }));

describe('CartPage', () => {
  it('shows an empty state when there are no items', async () => {
    renderApp('/cart');
    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
  });

  it('lists items and clears the cart', async () => {
    useCartStore.setState({ items: [{ product: cartProduct(), quantity: 1 }] });
    renderApp('/cart');
    expect(await screen.findByText('Order summary')).toBeInTheDocument();
    expect(screen.getByText('Obsidian Box')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /clear cart/i }));
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
