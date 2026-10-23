import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, api } from '@akknerds/api-client';
import { useAuthStore } from '../store/auth';
import { useCartStore } from '../store/cart';
import { makeProduct, renderApp } from '../test/utils';

beforeEach(() => {
  useCartStore.setState({ items: [] });
  useAuthStore.setState({ token: null, user: null, mustSetPassword: false });
  vi.restoreAllMocks();
});

describe('ProductDetailPage', () => {
  it('renders product details and adds to cart', async () => {
    vi.spyOn(api, 'getProduct').mockResolvedValue({ product: makeProduct() });
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });
    renderApp('/product/pokemon-151-booster-box-bb-151');

    expect(await screen.findByRole('heading', { name: /151 Booster Box/i })).toBeInTheDocument();
    expect(screen.getByText('In stock')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Add .* to cart/i }));
    expect(useCartStore.getState().items).toHaveLength(1);
  });

  it('shows currency-aware free shipping copy', async () => {
    vi.spyOn(api, 'getProduct').mockResolvedValue({ product: makeProduct() });
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });
    renderApp('/product/pokemon-151-booster-box-bb-151');

    expect(await screen.findByText(/Free shipping over /i)).toBeInTheDocument();
    expect(screen.queryByText(/Free shipping over \$75/)).not.toBeInTheDocument();
  });

  it('shows a scannable product QR on the detail page', async () => {
    vi.spyOn(api, 'getProduct').mockResolvedValue({ product: makeProduct() });
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });
    renderApp('/product/pokemon-151-booster-box-bb-151');

    expect(await screen.findByLabelText(/Product QR code/i)).toBeInTheDocument();
    expect(screen.getByText(/Scan in store/i)).toBeInTheDocument();
    expect(
      await screen.findByRole('img', { name: /QR code for Pokémon 151 Booster Box/i }),
    ).toBeInTheDocument();
  });

  it('does not oversell open-box returns on the PDP', async () => {
    vi.spyOn(api, 'getProduct').mockResolvedValue({ product: makeProduct() });
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });
    renderApp('/product/pokemon-151-booster-box-bb-151');

    expect(await screen.findByText(/unopened sealed goods/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /see Returns/i })).toHaveAttribute('href', '/returns');
    expect(screen.queryByText(/^14-day returns$/i)).not.toBeInTheDocument();
  });

  it('shows the full single-card image without cropping on the detail page', async () => {
    vi.spyOn(api, 'getProduct').mockResolvedValue({
      product: makeProduct({
        category: 'single-card',
        name: 'Arcanine EX',
        slug: 'arcanine-ex',
        images: ['cards/arcanine.png'],
        image: 'cards/arcanine.png',
      }),
    });
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });
    const { container } = renderApp('/product/arcanine-ex');

    await screen.findByRole('heading', { name: /Arcanine EX/i });
    const mainImage = container.querySelector('img[alt="Arcanine EX"]');
    expect(mainImage).toBeTruthy();
    expect(mainImage?.className).toContain('object-contain');
    expect(mainImage?.className).not.toContain('object-cover');
  });

  it('shows a not-found state when the product is missing', async () => {
    vi.spyOn(api, 'getProduct').mockRejectedValue(new ApiError('Product not found', 404));
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });
    renderApp('/product/ghost');
    await waitFor(() => expect(screen.getByText('Product not found')).toBeInTheDocument());
  });

  it('shows a sign-in gate for comments while keeping public ratings', async () => {
    vi.spyOn(api, 'getProduct').mockResolvedValue({
      product: makeProduct({ rating: 4.5, reviewCount: 12 }),
    });
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });
    renderApp('/product/pokemon-151-booster-box-bb-151');

    expect(await screen.findByRole('heading', { name: /Reviews & comments/i })).toBeInTheDocument();
    expect(screen.getByText(/Sign in to read comments/i)).toBeInTheDocument();
  });
});
