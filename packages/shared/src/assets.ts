/** Max width for kiosk/grid WebP thumbnails stored beside originals on the CDN. */
export const PRODUCT_THUMB_MAX_WIDTH = 480;

/** Original product uploads live under this prefix (not restorations/, etc.). */
const PRODUCT_IMAGE_KEY = /^products\/(?!thumbs\/)([A-Za-z0-9._-]+)$/;

/**
 * Resolve a product/asset path to a full URL.
 * Absolute URLs pass through; relative paths are prefixed with the CDN base.
 */
export function resolveAssetUrl(path: string | undefined, cdnBase?: string): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = cdnBase?.replace(/\/$/, '');
  if (!base) return path;
  return `${base}/${path.replace(/^\//, '')}`;
}

/**
 * Normalize a product image path or absolute CDN URL to an S3 object key.
 * Returns undefined for non-product keys (path traversal, restorations, etc.).
 */
export function productImageObjectKey(pathOrUrl: string | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  let path = pathOrUrl.trim();
  if (path.startsWith('http://') || path.startsWith('https://')) {
    try {
      path = new URL(path).pathname;
    } catch {
      return undefined;
    }
  }
  path = path.replace(/^\/+/, '');
  if (!PRODUCT_IMAGE_KEY.test(path) && !/^products\/thumbs\/[A-Za-z0-9._-]+\.webp$/.test(path)) {
    return undefined;
  }
  return path;
}

/** Deterministic thumbnail key for a product image (`products/foo.png` → `products/thumbs/foo.webp`). */
export function productThumbObjectKey(imagePathOrUrl: string | undefined): string | undefined {
  const key = productImageObjectKey(imagePathOrUrl);
  if (!key) return undefined;
  if (key.startsWith('products/thumbs/')) return key;
  const file = key.slice('products/'.length);
  const base = file.replace(/\.[^.]+$/, '');
  if (!base) return undefined;
  return `products/thumbs/${base}.webp`;
}

/** CDN URL for the kiosk/grid thumbnail (may 404 until generated — callers should fall back). */
export function resolveProductThumbUrl(
  path: string | undefined,
  cdnBase?: string,
): string | undefined {
  return resolveAssetUrl(productThumbObjectKey(path), cdnBase);
}

/** Primary catalog image (first in the images array, or legacy image field). */
export function primaryProductImage(product: {
  images?: string[];
  image?: string;
}): string | undefined {
  if (product.images && product.images.length > 0) return product.images[0];
  return product.image;
}

/** Resolve all product image paths to CDN URLs for rendering. */
export function productImageUrls(
  product: { images?: string[]; image?: string },
  cdnBase?: string,
): string[] {
  const paths =
    product.images && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [];
  return paths
    .map((path) => resolveAssetUrl(path, cdnBase))
    .filter((url): url is string => Boolean(url));
}
