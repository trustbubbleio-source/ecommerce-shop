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
    expect(screen.getByRole('heading', { name: /We go live October 15/i })).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /One More Rip storefront in Båstad/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Buy by category')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Never miss a drop/i, level: 2 })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getAllByRole('link', { name: /151 Booster Box/i }).length).toBeGreaterThan(0),
    );
  });

  it('links to the shop', () => {
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });
    renderApp('/');
    expect(screen.getAllByRole('link', { name: /Buy all products/i }).length).toBeGreaterThan(0);
  });
});
