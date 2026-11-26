import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SHOP_PAGE_SIZE, api } from '@akknerds/api-client';
import { makeProduct, renderApp } from '../../test/utils';

beforeEach(() => vi.restoreAllMocks());
afterEach(() => {
  vi.useRealTimers();
});

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
    expect(screen.getByRole('img', { name: /one more rip/i })).toBeInTheDocument();
    expect(screen.getByLabelText('Search products')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /151 Booster Box/i })).toBeInTheDocument();
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
  });

  it('shows the screensaver after idle and dismisses on tap', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(api, 'listProducts').mockResolvedValue({
      products: [makeProduct()],
      total: 1,
      hasMore: false,
      limit: SHOP_PAGE_SIZE,
      offset: 0,
    });
    renderApp('/kiosk');
    expect(await screen.findByRole('heading', { name: 'ONE MORE RIP' })).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });
    const screensaver = screen.getByRole('button', { name: /tap to browse/i });
    expect(screensaver).toBeInTheDocument();

    await userEvent.click(screensaver);
    expect(screen.queryByRole('button', { name: /tap to browse/i })).not.toBeInTheDocument();
  });

  it('opens the on-screen keyboard and searches', async () => {
    const spy = vi.spyOn(api, 'listProducts').mockResolvedValue({
      products: [],
      total: 0,
      hasMore: false,
      limit: SHOP_PAGE_SIZE,
      offset: 0,
    });
    renderApp('/kiosk');
    await screen.findByRole('heading', { name: 'ONE MORE RIP' });

    await userEvent.click(screen.getByLabelText('Search products'));
    expect(screen.getByRole('group', { name: /on-screen keyboard/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'C' }));
    await userEvent.click(screen.getByRole('button', { name: 'H' }));
    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    await userEvent.click(screen.getByRole('button', { name: 'R' }));

    await waitFor(() =>
      expect(spy.mock.calls.some(([q]) => q?.search === 'char')).toBe(true),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.queryByRole('group', { name: /on-screen keyboard/i })).not.toBeInTheDocument();
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
