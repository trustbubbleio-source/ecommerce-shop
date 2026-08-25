import type { Order, PublicUser } from '@akknerds/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { renderApp } from '../test/utils';

const emptyProfile = {
  phone: null,
  country: null,
  city: null,
  bio: null,
  shippingAddress: null,
  discountCode: null,
  preferredCurrency: 'eur' as const,
  marketingOptIn: false,
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const user: PublicUser = {
  id: 'usr_1',
  email: 'ash@pallet.town',
  name: 'Ash Ketchum',
  role: 'customer',
  emailVerifiedAt: '2024-01-01T00:00:00.000Z',
  hasPassword: true,
  profile: emptyProfile,
  createdAt: '2024-01-01T00:00:00.000Z',
};

const order: Order = {
  id: 'ord_123',
  email: user.email,
  userId: user.id,
  lines: [{ productId: 'bb-151', name: 'Booster Box', unitPrice: 16999, quantity: 1 }],
  subtotal: 16999,
  shipping: 0,
  total: 16999,
  currency: 'eur',
  status: 'paid',
  createdAt: '2024-02-01T00:00:00.000Z',
};

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null, mustSetPassword: false });
  vi.restoreAllMocks();
});

describe('Account pages', () => {
  it('redirects to login when signed out', async () => {
    renderApp('/account');
    expect(await screen.findByText('Welcome back')).toBeInTheDocument();
  });

  it('shows profile details when signed in', async () => {
    useAuthStore.setState({ token: 'tok_1', user });
    vi.spyOn(api, 'me').mockResolvedValue({ user });

    renderApp('/account');

    expect(await screen.findByText(/Hi, Ash/)).toBeInTheDocument();
    expect(screen.getByDisplayValue(user.name)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute('href', '/account/orders');
  });

  it('lists orders on the orders page', async () => {
    useAuthStore.setState({ token: 'tok_1', user });
    vi.spyOn(api, 'me').mockResolvedValue({ user });
    vi.spyOn(api, 'myOrders').mockResolvedValue({ orders: [order] });

    renderApp('/account/orders');

    expect(await screen.findByText(/Hi, Ash/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('ord_123')).toBeInTheDocument());
    expect(screen.getByText('paid')).toBeInTheDocument();
  });

  it('opens the account dropdown from the header', async () => {
    const click = userEvent.setup();
    useAuthStore.setState({ token: 'tok_1', user });
    vi.spyOn(api, 'me').mockResolvedValue({ user });
    vi.spyOn(api, 'listProducts').mockResolvedValue({
      products: [],
      total: 0,
      page: 1,
      pageSize: 12,
      meta: {
        categories: [],
        series: [],
        sets: [],
        priceRange: { min: 0, max: 0 },
      },
    } as never);

    renderApp('/');

    await click.click(await screen.findByRole('button', { name: 'Account menu' }));
    expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute('href', '/account');
    expect(screen.getByRole('menuitem', { name: 'Orders' })).toHaveAttribute(
      'href',
      '/account/orders',
    );
    expect(screen.getByRole('menuitem', { name: 'Favorites' })).toHaveAttribute(
      'href',
      '/account/favorites',
    );
    expect(screen.getByRole('menuitem', { name: 'Discount' })).toHaveAttribute(
      'href',
      '/account/discount',
    );
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/account/settings',
    );
  });
});
