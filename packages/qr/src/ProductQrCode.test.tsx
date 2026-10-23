import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as download from './download.js';
import * as generate from './generate.js';
import { ProductQrCode } from './ProductQrCode.js';

describe('ProductQrCode', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders admin controls and the live product URL', async () => {
    render(
      <ProductQrCode
        baseUrl="https://www.onemorerip.cards"
        slug="charizard-ex"
        productName="Charizard EX"
        variant="admin"
      />,
    );

    expect(screen.getByTestId('product-qr-code')).toHaveAttribute('data-variant', 'admin');
    expect(screen.getByText('Product QR code')).toBeInTheDocument();
    expect(
      screen.getByText('https://www.onemorerip.cards/product/charizard-ex'),
    ).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: /QR code for Charizard EX/i })).toBeInTheDocument();
  });

  it('downloads PNG and SVG when requested', async () => {
    const png = vi.spyOn(generate, 'generateQrPngDataUrl').mockResolvedValue('data:image/png;base64,xx');
    const svg = vi.spyOn(generate, 'generateQrSvg').mockResolvedValue('<svg></svg>');
    const dlPng = vi.spyOn(download, 'downloadQrPng').mockResolvedValue();
    const dlSvg = vi.spyOn(download, 'downloadQrSvg').mockResolvedValue();

    render(
      <ProductQrCode
        baseUrl="https://www.onemorerip.cards"
        slug="demo"
        productName="Demo Card"
        variant="admin"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Download PNG/i }));
    await waitFor(() => expect(dlPng).toHaveBeenCalled());
    expect(png).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /Download SVG/i }));
    await waitFor(() => expect(dlSvg).toHaveBeenCalled());
    expect(svg).toHaveBeenCalled();
  });

  it('copies the product link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    render(
      <ProductQrCode
        baseUrl="https://www.onemorerip.cards"
        slug="demo"
        productName="Demo"
        variant="storefront"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Copy product link/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://www.onemorerip.cards/product/demo'));
    expect(screen.getByRole('button', { name: /Copy product link/i })).toHaveTextContent('Copied');
  });

  it('surfaces download and clipboard errors', async () => {
    vi.spyOn(generate, 'generateQrPngDataUrl').mockRejectedValue(new Error('png boom'));
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });

    render(
      <ProductQrCode
        baseUrl="https://www.onemorerip.cards"
        slug="demo"
        productName="Demo"
        variant="admin"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Download PNG/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/png boom/i);

    await userEvent.click(screen.getByRole('button', { name: /Copy product link/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Could not copy link/i);
  });
});
