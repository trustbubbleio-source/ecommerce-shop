/** Allowed sell-request image MIME types (gallery + camera). */
export const SELL_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type SellImageMimeType = (typeof SELL_IMAGE_MIME_TYPES)[number];

export const SELL_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
export const SELL_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const SELL_MAX_CARDS = 8;
/** Soft cap so Resend attachments stay within practical email size. */
export const SELL_MAX_TOTAL_IMAGE_BYTES = 25 * 1024 * 1024;

export function isSellImageMimeType(value: string): value is SellImageMimeType {
  return (SELL_IMAGE_MIME_TYPES as readonly string[]).includes(value);
}

/**
 * Detect jpeg/png/webp from magic bytes (do not trust client Content-Type alone).
 * Returns null when the buffer is not a supported image.
 */
export function detectSellImageMime(buffer: Uint8Array): SellImageMimeType | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

export function sellImageExtension(mime: SellImageMimeType): 'jpg' | 'png' | 'webp' {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  return 'webp';
}

/** True when a browser File looks like a CSV (extension + optional MIME). */
export function isSellCsvFile(file: { name: string; type: string }): boolean {
  const name = file.name.toLowerCase();
  if (!name.endsWith('.csv')) return false;
  const type = file.type.toLowerCase();
  return (
    type === '' ||
    type === 'text/csv' ||
    type === 'application/csv' ||
    type === 'application/vnd.ms-excel' ||
    type === 'text/plain'
  );
}
