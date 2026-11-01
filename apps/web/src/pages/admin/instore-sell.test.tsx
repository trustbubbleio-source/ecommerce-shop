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
  it('records a card till sale and shows remaining stock', async () => {
    const product = makeProduct({ stock: 2, name: 'Charizard EX', slug: 'charizard-ex' });
    vi.spyOn(api, 'adminGetProduct').mockResolvedValue({ product });
    vi.spyOn(api, 'adminSellInStore').mockResolvedValue({
      product: { ...product, stock: 1 },
      order: {
        id: 'ord_instore_1',
        email: adminUser.email,
        lines: [
          {
            productId: product.id,
            name: product.name,
            unitPrice: product.price,
            quantity: 1,
          },
        ],
        subtotal: product.price,
        shipping: 0,
        total: product.price,
        currency: product.currency,
        status: 'fulfilled',
        channel: 'in_store',
        fulfillmentStep: 'delivered',
        createdAt: new Date().toISOString(),
      },
    });

    renderApp('/admin/instore/charizard-ex');

    expect(await screen.findByRole('heading', { name: /Charizard EX/i })).toBeInTheDocument();
    expect(screen.getByText(/How will they pay\?/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /^Card$/i }));

    await waitFor(() => {
      expect(api.adminSellInStore).toHaveBeenCalledWith(product.id, {
        quantity: 1,
        paymentMethod: 'card_manual',
      });
    });
    expect(await screen.findByText(/Stock left online:/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('ord_instore_1')).toBeInTheDocument();
    expect(screen.getByText(/Orders → Finished/i)).toBeInTheDocument();
  });

  it('starts Swish checkout and redirects to Stripe', async () => {
    const product = makeProduct({ stock: 2, name: 'Charizard EX', slug: 'charizard-ex' });
    vi.spyOn(api, 'adminGetProduct').mockResolvedValue({ product });
    vi.spyOn(api, 'adminSellInStore').mockResolvedValue({
      product: { ...product, stock: 1 },
      order: {
        id: 'ord_swish_1',
        email: adminUser.email,
        lines: [
          {
            productId: product.id,
            name: product.name,
            unitPrice: Math.round(product.price * 11.3),
            quantity: 1,
          },
        ],
        subtotal: Math.round(product.price * 11.3),
        shipping: 0,
        total: Math.round(product.price * 11.3),
        currency: 'sek',
        status: 'pending',
        channel: 'in_store',
        createdAt: new Date().toISOString(),
      },
      checkoutUrl: 'https://checkout.stripe.test/swish',
    });
    const assign = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign });

    renderApp('/admin/instore/charizard-ex');
    await screen.findByRole('heading', { name: /Charizard EX/i });
    await userEvent.click(screen.getByRole('button', { name: /^Swish$/i }));

    await waitFor(() => {
      expect(api.adminSellInStore).toHaveBeenCalledWith(product.id, {
        quantity: 1,
        paymentMethod: 'swish',
      });
      expect(assign).toHaveBeenCalledWith('https://checkout.stripe.test/swish');
    });
  });

  it('Cancel returns to the public product page', async () => {
    const product = makeProduct({ slug: 'charizard-ex', name: 'Charizard EX' });
    vi.spyOn(api, 'adminGetProduct').mockResolvedValue({ product });
    vi.spyOn(api, 'getProduct').mockResolvedValue({ product });
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });

    renderApp('/admin/instore/charizard-ex');
    await screen.findByRole('heading', { name: /Charizard EX/i });

    await userEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));

    // storefront=1 keeps admin on the PDP instead of bouncing back to till mode
    expect(await screen.findByRole('button', { name: /Add .* to cart/i })).toBeInTheDocument();
    expect(screen.queryByText(/How will they pay\?/i)).not.toBeInTheDocument();
  });
});

describe('ProductDetailPage admin redirect', () => {
  it('sends signed-in admins from the shelf QR to till mode', async () => {
    vi.spyOn(api, 'getProduct').mockResolvedValue({ product: makeProduct() });
    vi.spyOn(api, 'adminGetProduct').mockResolvedValue({
      product: makeProduct({ stock: 4 }),
    });

    renderApp('/product/pokemon-151-booster-box-bb-151');

    expect(await screen.findByText(/How will they pay\?/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Card$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Swish$/i })).toBeInTheDocument();
  });
});
