/**
 * Build canonical product paths and absolute URLs for QR payloads.
 * Always encode the live storefront origin — never localhost — so printed
 * codes keep working after you leave the admin machine.
 */

export function productPath(slug: string): string {
  const clean = slug.trim().replace(/^\/+/, '');
  if (!clean) {
    throw new Error('Product slug is required');
  }
  return `/product/${clean}`;
}

export function buildProductUrl(baseUrl: string, slug: string): string {
  const base = baseUrl.trim().replace(/\/+$/, '');
  if (!base) {
    throw new Error('Base URL is required');
  }
  return `${base}${productPath(slug)}`;
}
