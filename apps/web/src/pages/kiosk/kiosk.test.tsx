import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SHOP_PAGE_SIZE, api } from '@akknerds/api-client';
import { makeProduct, renderApp } from '../../test/utils';

beforeEach(() => vi.restoreAllMocks());

describe('Kiosk browse', () => {
  it('shows the brand, search, and products', async () => {
    vi.spyOn(api, 'listProducts').mockResolvedValue({
      products: [makeProduct()],
      total: 1,
      hasMore: false,
      limit: SHOP_PAGE_SIZE,
      offset: 0,
    });
    renderApp('/kiosk');

    expect(await screen.findByRole('heading', { name: 'ONE MORE RIP' })).toBeInTheDocument();
    expect(screen.getByLabelText('Search products')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /151 Booster Box/i })).toBeInTheDocument();
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
  });

  it('passes the search term to the api', async () => {
    const spy = vi.spyOn(api, 'listProducts').mockResolvedValue({
      products: [],
      total: 0,
      hasMore: false,
      limit: SHOP_PAGE_SIZE,
      offset: 0,
    });
    renderApp('/kiosk');
    await screen.findByRole('heading', { name: 'ONE MORE RIP' });

    await userEvent.type(screen.getByLabelText('Search products'), 'char');
    await waitFor(() =>
      expect(spy.mock.calls.some(([q]) => q?.search === 'char')).toBe(true),
    );
  });

  it('opens a product detail without checkout actions', async () => {
    const product = makeProduct();
    vi.spyOn(api, 'listProducts').mockResolvedValue({
      products: [product],
      total: 1,
      hasMore: false,
      limit: SHOP_PAGE_SIZE,
      offset: 0,
    });
    vi.spyOn(api, 'getProduct').mockResolvedValue({ product });

    renderApp('/kiosk');
    await userEvent.click(await screen.findByRole('link', { name: /151 Booster Box/i }));

    expect(await screen.findByRole('link', { name: /back/i })).toHaveAttribute('href', '/kiosk');
    expect(screen.getByRole('heading', { level: 1, name: product.name })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument();
    expect(screen.getByText(/10 in stock/i)).toBeInTheDocument();
  });
});
