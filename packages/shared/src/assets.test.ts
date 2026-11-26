import { describe, expect, it } from 'vitest';
import {
  productImageObjectKey,
  productThumbObjectKey,
  resolveProductThumbUrl,
} from './assets';

describe('product thumb keys', () => {
  it('maps a product image key to a webp thumb key', () => {
    expect(productThumbObjectKey('products/SCEyU21PVEeQDYCL.png')).toBe(
      'products/thumbs/SCEyU21PVEeQDYCL.webp',
    );
  });

  it('accepts absolute CDN urls', () => {
    expect(
      productImageObjectKey('https://cdn.example/products/abc-123.jpg'),
    ).toBe('products/abc-123.jpg');
    expect(resolveProductThumbUrl('https://cdn.example/products/abc-123.jpg', 'https://cdn.example')).toBe(
      'https://cdn.example/products/thumbs/abc-123.webp',
    );
  });

  it('rejects non-product paths', () => {
    expect(productImageObjectKey('restorations/x.png')).toBeUndefined();
    expect(productImageObjectKey('products/../secret.png')).toBeUndefined();
    expect(productThumbObjectKey('products/../secret.png')).toBeUndefined();
  });

  it('is idempotent for existing thumb keys', () => {
    expect(productThumbObjectKey('products/thumbs/abc.webp')).toBe('products/thumbs/abc.webp');
  });
});
