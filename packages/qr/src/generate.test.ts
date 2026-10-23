import { describe, expect, it } from 'vitest';
import { generateQrPngDataUrl, generateQrSvg, svgToDataUrl } from './generate.js';

describe('generateQrSvg', () => {
  it('returns SVG markup for a URL', async () => {
    const svg = await generateQrSvg('https://www.onemorerip.cards/product/demo');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('rejects empty content', async () => {
    await expect(generateQrSvg('  ')).rejects.toThrow(/content/i);
  });
});

describe('generateQrPngDataUrl', () => {
  it('returns a PNG data URL in the browser', async () => {
    const dataUrl = await generateQrPngDataUrl('https://www.onemorerip.cards/product/demo', {
      width: 128,
    });
    expect(dataUrl.startsWith('data:image/png')).toBe(true);
  });

  it('rejects empty content', async () => {
    await expect(generateQrPngDataUrl('')).rejects.toThrow(/content/i);
  });
});

describe('svgToDataUrl', () => {
  it('encodes SVG as a data URL', () => {
    const url = svgToDataUrl('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(url.startsWith('data:image/svg+xml')).toBe(true);
    expect(url).toContain('svg');
  });
});
