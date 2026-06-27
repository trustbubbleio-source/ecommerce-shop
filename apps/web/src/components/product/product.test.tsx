import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCartStore } from '../../store/cart';
import { makeProduct, renderWithProviders } from '../../test/utils';
import { AddToCartButton } from './add-to-cart-button';
import { PriceTag } from './price-tag';
import { ProductArt } from './product-art';
import { ProductCard } from './product-card';
import { ProductFiltersPanel } from './product-filters';

beforeEach(() => useCartStore.setState({ items: [] }));

describe('ProductCard', () => {
  it('renders product details and links to the detail page', () => {
    renderWithProviders(<ProductCard product={makeProduct()} />);
    expect(screen.getAllByRole('link', { name: /151 Booster Box/i }).length).toBeGreaterThan(0);
    expect(screen.getByText('$169.99')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('adds the product to the cart', async () => {
    renderWithProviders(<ProductCard product={makeProduct()} />);
    await userEvent.click(screen.getByRole('button', { name: /Add .* to cart/i }));
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(await screen.findByText('Added to cart')).toBeInTheDocument();
  });

  it('shows a low-stock badge', () => {
    renderWithProviders(<ProductCard product={makeProduct({ stock: 3, isNew: false })} />);
    expect(screen.getByText('Only 3 left')).toBeInTheDocument();
  });
});

describe('PriceTag', () => {
  it('shows discount when on sale', () => {
    renderWithProviders(<PriceTag product={makeProduct()} />);
    expect(screen.getByText('$169.99')).toBeInTheDocument();
    expect(screen.getByText('$189.99')).toBeInTheDocument();
    expect(screen.getByText(/-11%/)).toBeInTheDocument();
  });

  it('hides discount without a compare-at price', () => {
    renderWithProviders(<PriceTag product={makeProduct({ compareAtPrice: undefined })} />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});

describe('ProductArt', () => {
  it('renders branded art when there is no image', () => {
    renderWithProviders(<ProductArt product={makeProduct({ image: undefined })} />);
    expect(screen.getByRole('img', { name: /151 Booster Box/i })).toBeInTheDocument();
    expect(screen.getByText('151')).toBeInTheDocument();
  });

  it('renders a real image when present', () => {
    renderWithProviders(<ProductArt product={makeProduct({ image: 'https://x/y.png' })} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://x/y.png');
  });
});

describe('AddToCartButton', () => {
  it('is disabled and labelled sold out when out of stock', () => {
    renderWithProviders(<AddToCartButton product={makeProduct({ stock: 0 })} />);
    expect(screen.getByRole('button', { name: /sold out/i })).toBeDisabled();
  });
});

describe('ProductFiltersPanel', () => {
  const meta = {
    categories: [
      { value: 'booster-box' as const, count: 5 },
      { value: 'single-card' as const, count: 3 },
    ],
    series: ['Scarlet & Violet', 'Sword & Shield'],
    priceRange: { min: 100, max: 20000 },
  };

  it('renders categories and fires onChange when selected', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ProductFiltersPanel
        meta={meta}
        value={{ category: 'all', series: '', search: '', inStock: false, sort: 'featured' }}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Booster Box' }));
    expect(onChange).toHaveBeenCalledWith({ category: 'booster-box' });
  });

  it('toggles in-stock and selects series', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ProductFiltersPanel
        meta={meta}
        value={{ category: 'all', series: '', search: '', inStock: false, sort: 'featured' }}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith({ inStock: true });
    await userEvent.selectOptions(screen.getByLabelText('Series'), 'Sword & Shield');
    expect(onChange).toHaveBeenCalledWith({ series: 'Sword & Shield' });
  });

  it('shows reset only when filters are non-default', async () => {
    const onReset = vi.fn();
    const { rerender } = renderWithProviders(
      <ProductFiltersPanel
        meta={meta}
        value={{ category: 'all', series: '', search: '', inStock: false, sort: 'featured' }}
        onChange={vi.fn()}
        onReset={onReset}
      />,
    );
    expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument();
    rerender(
      <ProductFiltersPanel
        meta={meta}
        value={{
          category: 'single-card',
          series: '',
          search: '',
          inStock: false,
          sort: 'featured',
        }}
        onChange={vi.fn()}
        onReset={onReset}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(onReset).toHaveBeenCalled();
  });
});
