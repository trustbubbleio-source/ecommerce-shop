import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@akknerds/api-client';
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

describe('AdminInstoreSellPage', () => {
  beforeEach(() => {
    vi.mocked(api.adminGetProduct).mockResolvedValue({
      product: {
        id: 'prod_1',
        slug: 'test-card',
        name: 'Test Card',
        description: '',
        category: 'single-card',
        set: '151',
        series: 'Scarlet & Violet',
        price: 2500,
        currency: 'sek',
        images: [],
        accent: '#000',
        stock: 3,
        featured: false,
        isNew: false,
        storeOnly: false,
        inactive: false,
        rating: 0,
        reviewCount: 0,
        tags: [],
        language: 'english',
        releaseDate: '2024-01-01',
      },
    });
  });

  it('logs a card/cash sale without Swish', async () => {
    vi.mocked(api.adminSellInStore).mockResolvedValue({
      product: {
        id: 'prod_1',
        slug: 'test-card',
        name: 'Test Card',
        description: '',
        category: 'single-card',
        set: '151',
        series: 'Scarlet & Violet',
        price: 2500,
        currency: 'sek',
        images: [],
        accent: '#000',
        stock: 2,
        featured: false,
        isNew: false,
        storeOnly: false,
        inactive: false,
        rating: 0,
        reviewCount: 0,
        tags: [],
        language: 'english',
        releaseDate: '2024-01-01',
      },
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

    renderApp(['/admin/instore/test-card']);
    expect(await screen.findByRole('heading', { name: 'Test Card' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Swish$/i })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Log card \/ cash sale/i }));
    expect(api.adminSellInStore).toHaveBeenCalledWith('prod_1', {
      quantity: 1,
      paymentMethod: 'card_manual',
    });
  });
});
