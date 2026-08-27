import type { Order } from '@akknerds/shared';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@akknerds/api-client';
import { type CartProduct, useCartStore } from '../store/cart';
import { renderApp } from '../test/utils';

function cartProduct(): CartProduct {
  return {
    id: 'bb-151',
    slug: 'bb-151',
    name: 'Booster Box',
    price: 16999,
    accent: '#fff',
    category: 'booster-box',
    set: '151',
    series: 'Scarlet & Violet',
    currency: 'eur',
    stock: 5,
  };
}

const order: Order = {
  id: 'ord_1',
  email: 'buyer@example.com',
  lines: [{ productId: 'bb-151', name: 'Booster Box', unitPrice: 16999, quantity: 1 }],
  subtotal: 16999,
  shipping: 0,
  total: 16999,
  currency: 'eur',
  status: 'paid',
  createdAt: '2024-02-01T00:00:00.000Z',
};

beforeEach(() => {
  useCartStore.setState({ items: [] });
  vi.restoreAllMocks();
});

describe('CheckoutPage', () => {
  it('redirects to the cart when empty', async () => {
    renderApp('/checkout');
    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
  });

  it('shows the form and summary with items', async () => {
    useCartStore.setState({ items: [{ product: cartProduct(), quantity: 1 }] });
    renderApp('/checkout');
    expect(await screen.findByText('Shipping & contact')).toBeInTheDocument();
    expect(screen.getByText('Pay securely')).toBeInTheDocument();
  });
});

describe('CheckoutSuccessPage', () => {
  it('confirms the order and clears the cart', async () => {
    useCartStore.setState({ items: [{ product: cartProduct(), quantity: 1 }] });
    vi.spyOn(api, 'getOrder').mockResolvedValue({ order });
    renderApp('/checkout/success?order_id=ord_1');

    expect(await screen.findByText(/Thank you for your order/i)).toBeInTheDocument();
    expect(screen.getByText('ord_1')).toBeInTheDocument();
    expect(screen.getByText(/of which VAT \(25%\)/)).toBeInTheDocument();
    await waitFor(() => expect(useCartStore.getState().items).toHaveLength(0));
  });

  it('handles a missing order id', async () => {
    renderApp('/checkout/success');
    expect(await screen.findByText(/couldn't find that order/i)).toBeInTheDocument();
  });
});

describe('NotFoundPage', () => {
  it('renders for unknown routes', async () => {
    renderApp('/this-does-not-exist');
    expect(await screen.findByText('404')).toBeInTheDocument();
  });
});
