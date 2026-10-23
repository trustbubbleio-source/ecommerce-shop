import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  downloadDataUrl,
  downloadQrPng,
  downloadQrSvg,
  downloadTextFile,
  sanitizeDownloadFilename,
} from './download.js';

describe('sanitizeDownloadFilename', () => {
  it('slugifies product names', () => {
    expect(sanitizeDownloadFilename('Charizard EX #6')).toBe('charizard-ex-6');
  });

  it('falls back when empty', () => {
    expect(sanitizeDownloadFilename('@@@')).toBe('product-qr');
  });
});

describe('download helpers', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers an anchor click for data URLs', () => {
    const click = vi.fn();
    const remove = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      click,
      remove,
      rel: '',
      href: '',
      download: '',
    } as unknown as HTMLAnchorElement);
    const append = vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n);

    downloadDataUrl('data:image/png;base64,abc', 'demo-qr.png');

    expect(append).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(remove).toHaveBeenCalled();
  });

  it('downloads text via an object URL', () => {
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });

    const click = vi.fn();
    const remove = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue({
      click,
      remove,
      rel: '',
      href: '',
      download: '',
    } as unknown as HTMLAnchorElement);
    vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n);

    downloadTextFile('<svg></svg>', 'demo-qr.svg', 'image/svg+xml');

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });

  it('downloadQrPng and downloadQrSvg use sanitized filenames', async () => {
    const click = vi.fn();
    const remove = vi.fn();
    const anchor = {
      click,
      remove,
      rel: '',
      href: '',
      download: '',
    } as unknown as HTMLAnchorElement;
    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation((n) => n);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:svg'),
      revokeObjectURL: vi.fn(),
    });

    await downloadQrPng({ dataUrl: 'data:image/png;base64,xx', productName: 'Charizard EX' });
    expect(anchor.download).toBe('charizard-ex-qr.png');

    await downloadQrSvg({ svg: '<svg></svg>', productName: 'Charizard EX' });
    expect(anchor.download).toBe('charizard-ex-qr.svg');
  });
});
