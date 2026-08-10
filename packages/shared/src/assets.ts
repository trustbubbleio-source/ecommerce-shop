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
