import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../lib/api';
import { makeProduct, renderApp } from '../test/utils';

beforeEach(() => vi.restoreAllMocks());

function stubCatalog() {
  vi.spyOn(api, 'catalogMeta').mockResolvedValue({
    categories: [{ value: 'booster-box', count: 5 }],
    series: ['Scarlet & Violet'],
    priceRange: { min: 100, max: 20000 },
  });
}

describe('ShopPage', () => {
  it('lists products with a result count', async () => {
    stubCatalog();
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [makeProduct()], total: 1 });
    renderApp('/shop');

    expect(await screen.findByText('1 product')).toBeInTheDocument();
    expect(screen.getAllByText(/151 Booster Box/i).length).toBeGreaterThan(0);
  });

  it('shows an empty state when nothing matches', async () => {
    stubCatalog();
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });
    renderApp('/shop');
    expect(await screen.findByText('No products found')).toBeInTheDocument();
  });

  it('passes the search term to the api', async () => {
    stubCatalog();
    const spy = vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });
    renderApp('/shop');
    await userEvent.type(screen.getByLabelText('Search products'), 'char');
    await waitFor(() => expect(spy.mock.calls.some(([q]) => q?.search === 'char')).toBe(true));
  });
});
