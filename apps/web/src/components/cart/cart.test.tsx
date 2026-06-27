import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { type CartProduct, useCartStore } from '../../store/cart';
import { LocationProbe, renderWithProviders } from '../../test/utils';
import { CartDrawer } from '../layout/cart-drawer';
import { CartLineItem } from './cart-line-item';
import { CartSummary } from './cart-summary';

function cartProduct(overrides: Partial<CartProduct> = {}): CartProduct {
  return {
    id: 'p1',
    slug: 'p1',
    name: 'Obsidian Box',
    price: 2000,
    accent: '#fff',
    category: 'booster-box',
    set: '151',
    series: 'Scarlet & Violet',
    currency: 'usd',
    stock: 5,
    ...overrides,
  };
}

beforeEach(() => useCartStore.setState({ items: [] }));

describe('CartLineItem', () => {
  it('updates quantity and removes the item', async () => {
    useCartStore.setState({ items: [{ product: cartProduct(), quantity: 1 }] });
    renderWithProviders(<CartLineItem item={{ product: cartProduct(), quantity: 1 }} />);

    await userEvent.click(screen.getByLabelText('Increase quantity'));
    expect(useCartStore.getState().items[0]!.quantity).toBe(2);

    await userEvent.click(screen.getByLabelText(/Remove Obsidian Box/));
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('shows the line total', () => {
    renderWithProviders(<CartLineItem item={{ product: cartProduct(), quantity: 2 }} />);
    expect(screen.getByText('$40.00')).toBeInTheDocument();
  });
});

describe('CartSummary', () => {
  it('shows subtotal, shipping and total with a free-shipping nudge', () => {
    renderWithProviders(
      <CartSummary items={[{ product: cartProduct({ price: 2000 }), quantity: 1 }]} />,
    );
    expect(screen.getByText('$20.00')).toBeInTheDocument();
    expect(screen.getByText('$5.99')).toBeInTheDocument(); // shipping
    expect(screen.getByText(/free shipping/i)).toBeInTheDocument();
  });

  it('shows free shipping when the threshold is met', () => {
    renderWithProviders(
      <CartSummary items={[{ product: cartProduct({ price: 9000 }), quantity: 1 }]} />,
    );
    expect(screen.getByText(/unlocked free shipping/i)).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });
});

describe('CartDrawer', () => {
  it('shows an empty state when the cart is empty', async () => {
    renderWithProviders(<CartDrawer />);
    await userEvent.click(screen.getByRole('button', { name: /Open cart/ }));
    expect(await screen.findByText('Your cart is empty')).toBeInTheDocument();
  });

  it('lists items and navigates to checkout', async () => {
    useCartStore.setState({ items: [{ product: cartProduct(), quantity: 2 }] });
    renderWithProviders(
      <>
        <CartDrawer />
        <LocationProbe />
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: /Open cart/ }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Obsidian Box')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Checkout' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/checkout');
  });
});
