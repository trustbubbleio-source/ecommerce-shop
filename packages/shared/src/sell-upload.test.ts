import { describe, expect, it } from 'vitest';
import { detectSellImageMime, isSellCsvFile, isSellImageMimeType } from './sell-upload.js';

describe('sell upload guards', () => {
  it('accepts only jpeg/png/webp mime types', () => {
    expect(isSellImageMimeType('image/jpeg')).toBe(true);
    expect(isSellImageMimeType('image/png')).toBe(true);
    expect(isSellImageMimeType('image/webp')).toBe(true);
    expect(isSellImageMimeType('image/gif')).toBe(false);
    expect(isSellImageMimeType('image/heic')).toBe(false);
  });

  it('detects image formats from magic bytes', () => {
    expect(detectSellImageMime(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(
      detectSellImageMime(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    ).toBe('image/png');
    expect(
      detectSellImageMime(
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
        ]),
      ),
    ).toBe('image/webp');
    expect(detectSellImageMime(new Uint8Array([0x00, 0x01, 0x02]))).toBeNull();
  });

  it('only allows .csv files for import', () => {
    expect(isSellCsvFile({ name: 'lot.csv', type: 'text/csv' })).toBe(true);
    expect(isSellCsvFile({ name: 'lot.CSV', type: '' })).toBe(true);
    expect(isSellCsvFile({ name: 'lot.xlsx', type: 'application/vnd.ms-excel' })).toBe(false);
    expect(isSellCsvFile({ name: 'lot.csv.exe', type: 'text/csv' })).toBe(false);
  });
});
