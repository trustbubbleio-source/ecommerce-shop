/** Shared shop-link active matching for the mobile Buy accordion. */

export function shopLinkActive(to: string, pathname: string, search: string): boolean {
  if (to === '/shop') return pathname === '/shop' && !search.includes('category=');
  try {
    const url = new URL(to, 'http://local');
    if (pathname !== url.pathname) return false;
    const want = url.searchParams.get('category');
    const have = new URLSearchParams(search).get('category');
    return want === have;
  } catch {
    return false;
  }
}
