import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import { makeProduct, renderApp } from '../test/utils';

beforeEach(() => vi.restoreAllMocks());

describe('HomePage', () => {
  it('renders the hero and featured products', async () => {
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [makeProduct()], total: 1 });
    renderApp('/');

    expect(screen.getByRole('heading', { name: /Catch the/i })).toBeInTheDocument();
    expect(screen.getByText('Shop by category')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText(/151 Booster Box/i).length).toBeGreaterThan(0));
  });

  it('links to the shop', () => {
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });
    renderApp('/');
    expect(screen.getAllByRole('link', { name: /Shop all products/i }).length).toBeGreaterThan(0);
  });
});
