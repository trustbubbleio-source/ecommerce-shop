import type { Order, PublicUser } from '@akknerds/shared';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { renderApp } from '../test/utils';

const user: PublicUser = {
  id: 'usr_1',
  email: 'ash@pallet.town',
  name: 'Ash Ketchum',
  role: 'customer',
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
  currency: 'usd',
  status: 'paid',
  createdAt: '2024-02-01T00:00:00.000Z',
};

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null });
  vi.restoreAllMocks();
});

describe('AccountPage', () => {
  it('redirects to login when signed out', async () => {
    renderApp('/account');
    expect(await screen.findByText('Welcome back')).toBeInTheDocument();
  });

  it('shows the user and their orders when signed in', async () => {
    useAuthStore.setState({ token: 'tok_1', user });
    vi.spyOn(api, 'me').mockResolvedValue({ user });
    vi.spyOn(api, 'myOrders').mockResolvedValue({ orders: [order] });

    renderApp('/account');

    expect(await screen.findByText(/Hi, Ash/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('ord_123')).toBeInTheDocument());
    expect(screen.getByText('paid')).toBeInTheDocument();
  });
});
