import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SHOP_PAGE_SIZE, api } from '@akknerds/api-client';
import { makeProduct, renderApp } from '../test/utils';

beforeEach(() => vi.restoreAllMocks());

describe('ShopPage', () => {
  it('lists products with a result count', async () => {
    vi.spyOn(api, 'listProducts').mockResolvedValue({
      products: [makeProduct()],
      total: 1,
      hasMore: false,
      limit: SHOP_PAGE_SIZE,
      offset: 0,
    });
    renderApp('/shop');

    expect(await screen.findByText('1 product')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /151 Booster Box/i })).toBeInTheDocument();
  });

  it('shows an empty state when nothing matches', async () => {
    vi.spyOn(api, 'listProducts').mockResolvedValue({
      products: [],
      total: 0,
      hasMore: false,
      limit: SHOP_PAGE_SIZE,
      offset: 0,
    });
    renderApp('/shop');
    expect(await screen.findByText('No products found')).toBeInTheDocument();
  });

  it('shows an error state with retry when the catalogue fails', async () => {
    const spy = vi.spyOn(api, 'listProducts').mockRejectedValue(new Error('network down'));
    renderApp('/shop');

    expect(await screen.findByRole('heading', { name: "Couldn't load products" })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.queryByText('No products found')).not.toBeInTheDocument();

    spy.mockResolvedValue({
      products: [makeProduct()],
      total: 1,
      hasMore: false,
      limit: SHOP_PAGE_SIZE,
      offset: 0,
    });
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('1 product')).toBeInTheDocument();
  });

  it('passes the search term to the api', async () => {
    const spy = vi.spyOn(api, 'listProducts').mockResolvedValue({
      products: [],
      total: 0,
      hasMore: false,
      limit: SHOP_PAGE_SIZE,
      offset: 0,
    });
    renderApp('/shop');
    await userEvent.type(screen.getByLabelText('Search products'), 'char');
    await waitFor(() =>
      expect(
        spy.mock.calls.some(
          ([q]) => q?.search === 'char' && q.limit === SHOP_PAGE_SIZE && q.offset === 0,
        ),
      ).toBe(true),
    );
  });

  it('loads the next page when Load more is pressed', async () => {
    const spy = vi
      .spyOn(api, 'listProducts')
      .mockResolvedValueOnce({
        products: [makeProduct({ id: 'p1', name: 'Alpha Box', slug: 'alpha-box' })],
        total: 2,
        hasMore: true,
        limit: SHOP_PAGE_SIZE,
        offset: 0,
      })
      .mockResolvedValueOnce({
        products: [makeProduct({ id: 'p2', name: 'Beta Pack', slug: 'beta-pack' })],
        total: 2,
        hasMore: false,
        limit: SHOP_PAGE_SIZE,
        offset: SHOP_PAGE_SIZE,
      });

    renderApp('/shop');
    expect(await screen.findByText('Showing 1 of 2 products')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Alpha Box/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Load more/i }));
    expect(await screen.findByRole('link', { name: /Beta Pack/i })).toBeInTheDocument();
    expect(screen.getByText('2 products')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Load more/i })).not.toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1]![0]).toMatchObject({ offset: SHOP_PAGE_SIZE, limit: SHOP_PAGE_SIZE });
  });
});
