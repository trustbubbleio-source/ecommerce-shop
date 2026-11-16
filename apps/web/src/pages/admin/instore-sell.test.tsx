import type { PublicUser } from '@akknerds/shared';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@akknerds/api-client';
import { useAuthStore } from '../../store/auth';
import { renderApp } from '../../test/utils';

vi.mock('@akknerds/api-client', async () => {
  const actual = await vi.importActual<typeof import('@akknerds/api-client')>('@akknerds/api-client');
  return {
    ...actual,
    api: {
      ...actual.api,
      adminGetProduct: vi.fn(),
      adminSellInStore: vi.fn(),
    },
  };
});

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
    preferredCurrency: 'sek',
    marketingOptIn: false,
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
};

const product = {
  id: 'prod_1',
  slug: 'test-card',
  name: 'Test Card',
  description: '',
  category: 'single-card' as const,
  set: '151' as const,
  series: 'Scarlet & Violet' as const,
  price: 2500,
  currency: 'sek',
  images: [] as string[],
  accent: '#000',
  stock: 3,
  featured: false,
  isNew: false,
  storeOnly: false,
  inactive: false,
  rating: 0,
  reviewCount: 0,
  tags: [] as string[],
  language: 'english' as const,
  releaseDate: '2024-01-01',
};

describe('AdminInstoreSellPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: 'tok_admin', user: admin, mustSetPassword: false });
    vi.mocked(api.adminGetProduct).mockResolvedValue({ product });
    vi.spyOn(api, 'me').mockResolvedValue({ user: admin });
  });

  it('logs a card/cash sale without Swish', async () => {
    vi.mocked(api.adminSellInStore).mockResolvedValue({
      product: { ...product, stock: 2 },
      order: {
        id: 'ord_1',
        email: 'admin@test.local',
        lines: [],
        subtotal: 2500,
        shipping: 0,
        total: 2500,
        currency: 'sek',
        status: 'fulfilled',
        channel: 'in_store',
        createdAt: new Date().toISOString(),
      },
    });

    renderApp('/admin/instore/test-card');
    expect(await screen.findByRole('heading', { name: 'Test Card' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Swish$/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Log card \/ cash sale/i }));
    expect(api.adminSellInStore).toHaveBeenCalledWith('prod_1', {
      quantity: 1,
      paymentMethod: 'card_manual',
    });
  });
});
