import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QrCodeImage } from './QrCodeImage.js';

describe('QrCodeImage', () => {
  it('renders an image for a product URL', async () => {
    render(
      <QrCodeImage
        value="https://www.onemorerip.cards/product/demo"
        alt="QR code for Demo"
        size={128}
      />,
    );

    expect(screen.getByLabelText(/Generating QR code/i)).toBeInTheDocument();

    const img = await screen.findByRole('img', { name: /QR code for Demo/i });
    await waitFor(() => {
      expect(img.getAttribute('src') ?? '').toMatch(/^data:image\/svg\+xml/);
    });
  });

  it('shows an error for empty values', async () => {
    render(<QrCodeImage value="   " />);
    expect(await screen.findByRole('alert')).toHaveTextContent(/content/i);
  });
});
