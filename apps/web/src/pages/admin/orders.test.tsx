import type { Order, PublicUser } from '@akknerds/shared';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@akknerds/api-client';
import { useAuthStore } from '../../store/auth';
import { renderApp } from '../../test/utils';

const admin: PublicUser = {
  id: 'usr_admin',
  email: 'admin@test.local',
  name: 'Admin',
  role: 'admin',
  emailVerifiedAt: '2024-01-01T00:00:00.000Z',
  hasPassword: true,
  profile: {
    phone: null,
    country: null,
    city: null,
    bio: null,
    shippingAddress: null,
    discountCode: null,
    preferredCurrency: 'eur',
    marketingOptIn: false,
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
};

const order: Order = {
  id: 'ord_admin_1',
  email: 'buyer@example.com',
  userId: 'usr_1',
  lines: [{ productId: 'bb-151', name: 'Booster Box', unitPrice: 16999, quantity: 1 }],
  subtotal: 16999,
  shipping: 0,
  total: 16999,
  currency: 'eur',
  status: 'paid',
  fulfillmentStep: 'packing',
  createdAt: '2024-02-01T00:00:00.000Z',
};

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null, mustSetPassword: false });
  vi.restoreAllMocks();
});

describe('Admin orders', () => {
  it('lists paid orders for packing', async () => {
    useAuthStore.setState({ token: 'tok_admin', user: admin });
    vi.spyOn(api, 'me').mockResolvedValue({ user: admin });
    vi.spyOn(api, 'adminListOrders').mockResolvedValue({ orders: [order] });

    renderApp('/admin/orders');

    expect(await screen.findByRole('heading', { name: 'Orders' })).toBeInTheDocument();
    const row = await screen.findByRole('link', { name: 'Open Booster Box' });
    expect(row).toHaveAttribute('href', '/admin/orders/ord_admin_1');
    expect(row).toHaveTextContent('Packing');
    expect(screen.getByRole('tab', { name: /Need to pack/ })).toHaveTextContent('1');
    expect(screen.getByRole('tab', { name: /^All/ })).toHaveTextContent('1');

    await userEvent.click(screen.getByRole('tab', { name: /Finished/ }));
    expect(screen.queryByRole('link', { name: 'Open Booster Box' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /Need to pack/ }));
    expect(screen.getByRole('link', { name: 'Open Booster Box' })).toBeInTheDocument();
  });
});
