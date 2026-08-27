import type { Order, PublicUser } from '@akknerds/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@akknerds/api-client';
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
  invoiceUrl: 'https://pay.stripe.com/invoice/acct/inv_1/pdf',
  shippingAddress: {
    fullName: 'Ash Ketchum',
    line1: '1 Pallet Path',
    city: 'Malmö',
    postalCode: '211 00',
    country: 'Sweden',
  },
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
    await waitFor(() => expect(screen.getByText('Booster Box')).toBeInTheDocument());
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Booster Box, Confirmed/i })).toHaveAttribute(
      'href',
      '/account/orders/ord_123',
    );
    expect(screen.getByText(/Malmö/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Invoice.pdf' })).toHaveAttribute(
      'href',
      order.invoiceUrl,
    );
  });

  it('opens order details with a tracking timeline', async () => {
    useAuthStore.setState({ token: 'tok_1', user });
    vi.spyOn(api, 'me').mockResolvedValue({ user });
    vi.spyOn(api, 'getOrder').mockResolvedValue({ order });

    renderApp('/account/orders/ord_123');

    expect(await screen.findByText('Order details')).toBeInTheDocument();
    expect(screen.getByText('Received')).toBeInTheDocument();
    expect(screen.getByText('Packing')).toBeInTheDocument();
    expect(screen.getByText('Awaiting pickup')).toBeInTheDocument();
    expect(screen.getByText('Handed to carrier')).toBeInTheDocument();
    expect(screen.getByText('In transit')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
    expect(screen.getByText('In progress')).toBeInTheDocument();
    expect(screen.getByText('Carrier details')).toBeInTheDocument();
    expect(screen.getByText('Assigned at dispatch')).toBeInTheDocument();
    expect(screen.getByText('Issued when the parcel is collected')).toBeInTheDocument();
    expect(screen.getByText('Ash Ketchum')).toBeInTheDocument();
    expect(screen.getByText(/1 Pallet Path/)).toBeInTheDocument();
    expect(screen.getByText(/of which VAT \(25%\)/)).toBeInTheDocument();
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
    expect(screen.getByRole('menuitem', { name: 'Want list' })).toHaveAttribute(
      'href',
      '/account/want-list',
    );
    expect(screen.queryByRole('menuitem', { name: 'Discount' })).not.toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/account/settings',
    );
  });
});
