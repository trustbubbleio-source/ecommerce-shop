import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@akknerds/api-client';
import { LocationProbe, makeProduct, renderWithProviders } from '../../test/utils';
import { SearchDialog } from './search-dialog';

beforeEach(() => vi.restoreAllMocks());

describe('SearchDialog', () => {
  it('opens with browse shortcuts and searches live', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'listProducts').mockResolvedValue({
      products: [makeProduct({ name: 'Charizard ex Single', slug: 'charizard-ex-single' })],
      total: 1,
    });

    renderWithProviders(
      <>
        <SearchDialog />
        <LocationProbe />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Booster Boxes' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '151' })).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'char');

    await waitFor(() => {
      expect(api.listProducts).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'char', limit: 6 }),
      );
    });

    expect(await screen.findByText('Charizard ex Single')).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: /Charizard ex Single/i }));
    expect(screen.getByTestId('location')).toHaveTextContent('/product/charizard-ex-single');
  });

  it('submits to the shop search page', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'listProducts').mockResolvedValue({ products: [], total: 0 });

    renderWithProviders(
      <>
        <SearchDialog />
        <LocationProbe />
      </>,
    );

    await user.click(screen.getByRole('button', { name: 'Search' }));
    await user.type(screen.getByRole('searchbox'), 'pikachu{Enter}');

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent('/shop?search=pikachu');
    });
  });
});
