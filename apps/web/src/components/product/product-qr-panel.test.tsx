import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/utils';
import { ProductQrPanel } from './product-qr-panel';

describe('ProductQrPanel', () => {
  it('renders an admin QR panel with the live product URL', async () => {
    renderWithProviders(
      <ProductQrPanel slug="charizard-ex" productName="Charizard EX" variant="admin" />,
    );

    expect(screen.getByText('QR code')).toBeInTheDocument();
    expect(
      screen.getByText('https://www.onemorerip.cards/product/charizard-ex'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open live page/i })).toHaveAttribute(
      'href',
      'https://www.onemorerip.cards/product/charizard-ex',
    );
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /QR code for Charizard EX/i })).toBeInTheDocument();
    });
  });

  it('renders a storefront QR section', async () => {
    renderWithProviders(
      <ProductQrPanel slug="charizard-ex" productName="Charizard EX" variant="storefront" />,
    );

    expect(screen.getByLabelText(/Product QR code/i)).toBeInTheDocument();
    expect(screen.getByText(/Scan in store/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('img', { name: /QR code for Charizard EX/i })).toBeInTheDocument();
    });
  });
});
