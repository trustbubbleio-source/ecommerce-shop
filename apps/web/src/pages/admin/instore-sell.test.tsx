import type { PublicUser } from '@akknerds/shared';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@akknerds/api-client';
import { useAuthStore } from '../../store/auth';
import { makeProduct, renderApp } from '../../test/utils';

const adminUser: PublicUser = {
  id: 'admin-1',
  email: 'admin@onemorerip.local',
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

beforeEach(() => {
  vi.restoreAllMocks();
  useAuthStore.setState({
    token: 'test-token',
    user: adminUser,
    mustSetPassword: false,
  });
});

describe('AdminInstoreSellPage', () => {
  it('sells one unit and shows remaining stock', async () => {
    const product = makeProduct({ stock: 2, name: 'Charizard EX', slug: 'charizard-ex' });
    vi.spyOn(api, 'adminGetProduct').mockResolvedValue({ product });
    vi.spyOn(api, 'adminSellInStore').mockResolvedValue({
      product: { ...product, stock: 1 },
    });

    renderApp('/admin/instore/charizard-ex');

    expect(await screen.findByRole('heading', { name: /Charizard EX/i })).toBeInTheDocument();
    expect(screen.getByText(/Sold in store\?/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^Yes$/i }));

    await waitFor(() => {
      expect(api.adminSellInStore).toHaveBeenCalledWith(product.id, { quantity: 1 });
    });
    expect(await screen.findByText(/Stock left online:/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/Take payment on Stripe/i)).toBeInTheDocument();
  });

  it('No returns to the public product page', async () => {
    const product = makeProduct({ slug: 'charizard-ex', name: 'Charizard EX' });
    vi.spyOn(api, 'adminGetProduct').mockResolvedValue({ product });
    vi.spyOn(api, 'getProduct').mockResolvedValue({ product });
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });

    renderApp('/admin/instore/charizard-ex');
    await screen.findByRole('heading', { name: /Charizard EX/i });

    await userEvent.click(screen.getByRole('button', { name: /^No$/i }));

    // storefront=1 keeps admin on the PDP instead of bouncing back to till mode
    expect(await screen.findByRole('button', { name: /Add .* to cart/i })).toBeInTheDocument();
    expect(screen.queryByText(/Sold in store\?/i)).not.toBeInTheDocument();
  });
});

describe('ProductDetailPage admin redirect', () => {
  it('sends signed-in admins from the shelf QR to till mode', async () => {
    vi.spyOn(api, 'getProduct').mockResolvedValue({ product: makeProduct() });
    vi.spyOn(api, 'adminGetProduct').mockResolvedValue({
      product: makeProduct({ stock: 4 }),
    });

    renderApp('/product/pokemon-151-booster-box-bb-151');

    expect(await screen.findByText(/Sold in store\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Yes$/i })).toBeInTheDocument();
  });
});
