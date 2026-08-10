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
  it('shows series and category overlay on sealed products', () => {
    renderWithProviders(<ProductCard product={makeProduct()} />);
    expect(screen.getByRole('link', { name: /151 Booster Box/i })).toBeInTheDocument();
    expect(screen.getByText('$169.99')).toBeInTheDocument();
    expect(screen.getByText('Booster Box')).toBeInTheDocument();
    expect(screen.getByText('Scarlet & Violet')).toBeInTheDocument();
    expect(screen.getByText('151')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add .* to cart/i })).toBeInTheDocument();
    expect(screen.queryByText(/Pokémon 151 Booster Box/i)).not.toBeInTheDocument();
  });

  it('adds the product to the cart', async () => {
    renderWithProviders(<ProductCard product={makeProduct()} />);
    await userEvent.click(screen.getByRole('button', { name: /Add .* to cart/i }));
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(await screen.findByText('Added to cart')).toBeInTheDocument();
  });

  it('shows sold out overlay when out of stock', () => {
    renderWithProviders(<ProductCard product={makeProduct({ stock: 0, isNew: false })} />);
    expect(screen.getAllByText('Sold out').length).toBeGreaterThan(0);
  });

  it('shows card number and rarity icon on singles', () => {
    const { container } = renderWithProviders(
      <ProductCard
        product={makeProduct({
          category: 'single-card',
          cardNumber: '178/165',
          rarity: 'secret-rare',
          isNew: false,
        })}
      />,
    );
    expect(screen.getByText('178/165')).toBeInTheDocument();
    expect(container.querySelector('.absolute.bottom-2 img')).toBeTruthy();
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

  it('renders a real image with overlay on sealed shop cards', () => {
    renderWithProviders(
      <ProductArt product={makeProduct({ image: 'https://x/y.png' })} variant="card" />,
    );
    expect(screen.getByRole('img', { name: /151 Booster Box/i })).toBeInTheDocument();
    expect(screen.getByText('Booster Box')).toBeInTheDocument();
    expect(screen.getByText('151')).toBeInTheDocument();
  });

  it('renders a clean single-card image without overlay in card variant', () => {
    renderWithProviders(
      <ProductArt
        product={makeProduct({ category: 'single-card', image: 'https://x/y.png' })}
        variant="card"
      />,
    );
    expect(screen.getByRole('img', { name: /151 Booster Box/i })).toBeInTheDocument();
    expect(screen.queryByText('Booster Box')).not.toBeInTheDocument();
    expect(screen.queryByText('151')).not.toBeInTheDocument();
  });

  it('renders a clean single-card image without overlay in detail variant', () => {
    renderWithProviders(
      <ProductArt
        product={makeProduct({ category: 'single-card', image: 'https://x/y.png' })}
      />,
    );
    expect(screen.getByRole('img', { name: /151 Booster Box/i })).toBeInTheDocument();
    expect(screen.queryByText('Booster Box')).not.toBeInTheDocument();
    expect(screen.queryByText('151')).not.toBeInTheDocument();
  });

  it('renders a real image with overlay in detail variant for sealed products', () => {
    renderWithProviders(<ProductArt product={makeProduct({ image: 'https://x/y.png' })} />);
    expect(screen.getByRole('img', { name: /151 Booster Box/i })).toBeInTheDocument();
    expect(screen.getByText('Booster Box')).toBeInTheDocument();
    expect(screen.getByText('151')).toBeInTheDocument();
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
    sets: ['151', 'Obsidian Flames'],
    priceRange: { min: 100, max: 20000 },
  };

  it('renders categories and fires onChange when selected', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ProductFiltersPanel
        meta={meta}
        value={{ category: 'all', series: '', search: '', inStock: false, language: '', condition: '', sort: 'featured' }}
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
        value={{ category: 'all', series: '', search: '', inStock: false, language: '', condition: '', sort: 'featured' }}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith({ inStock: true });
    await userEvent.selectOptions(screen.getByLabelText('Series'), 'Sword & Shield');
    expect(onChange).toHaveBeenCalledWith({ series: 'Sword & Shield' });
  });

  it('toggles language and condition chips', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ProductFiltersPanel
        meta={meta}
        value={{ category: 'all', series: '', search: '', inStock: false, language: '', condition: '', sort: 'featured' }}
        onChange={onChange}
        onReset={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Japanese' }));
    expect(onChange).toHaveBeenCalledWith({ language: 'japanese' });
    await userEvent.click(screen.getByRole('button', { name: 'Near Mint' }));
    expect(onChange).toHaveBeenCalledWith({ condition: 'near-mint' });
  });

  it('shows reset only when filters are non-default', async () => {
    const onReset = vi.fn();
    const { rerender } = renderWithProviders(
      <ProductFiltersPanel
        meta={meta}
        value={{ category: 'all', series: '', search: '', inStock: false, language: '', condition: '', sort: 'featured' }}
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
          language: '',
          condition: '',
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
