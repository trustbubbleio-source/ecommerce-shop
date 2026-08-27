import type { PublicUser } from '@akknerds/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@akknerds/api-client';
import { useAuthStore } from '../../store/auth';
import { makeProduct, renderApp } from '../../test/utils';

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

const stats = { listings: 11, unitsInStock: 40, inventoryValueCents: 100000 };
const page1 = Array.from({ length: 10 }, (_, i) =>
  makeProduct({ id: `p-${i}`, name: `Listing ${i}`, slug: `listing-${i}` }),
);
const page2 = [makeProduct({ id: 'p-10', name: 'Listing 10', slug: 'listing-10' })];

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null, mustSetPassword: false });
  vi.restoreAllMocks();
});

describe('Admin products', () => {
  it('searches the catalog and pages 10 at a time', async () => {
    useAuthStore.setState({ token: 'tok_admin', user: admin });
    vi.spyOn(api, 'me').mockResolvedValue({ user: admin });
    const spy = vi.spyOn(api, 'adminListProducts').mockImplementation(async (query = {}) => {
      if (query.search?.toLowerCase().includes('charizard')) {
        return {
          products: [makeProduct({ id: 'sc-charizard', name: 'Charizard ex', slug: 'charizard-ex' })],
          total: 1,
          limit: 10,
          offset: 0,
          hasMore: false,
          stats,
        };
      }
      const offset = query.offset ?? 0;
      return {
        products: offset === 0 ? page1 : page2,
        total: 11,
        limit: 10,
        offset,
        hasMore: offset === 0,
        stats,
      };
    });

    renderApp('/admin');

    expect(await screen.findByText('Listing 0')).toBeInTheDocument();
    expect(screen.getByText(/Showing 1.10 of 11/)).toBeInTheDocument();
    expect(screen.queryByText('Listing 10')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Listing 10')).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ offset: 10, limit: 10 }));

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search products' }), 'charizard');
    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ search: 'charizard' }));
    });
    expect(await screen.findByText('Charizard ex')).toBeInTheDocument();
    expect(screen.getByText('1 matching')).toBeInTheDocument();
  });
});
