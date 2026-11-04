/** Location state key + helpers for returning to the filtered admin product list. */

export const ADMIN_PRODUCTS_LIST_STATE_KEY = 'adminListSearch' as const;

export type AdminProductsListLocationState = {
  [ADMIN_PRODUCTS_LIST_STATE_KEY]?: string;
};

/** Build `/admin` with an optional `?q=&category=…` query string. */
export function adminProductsListPath(search = ''): string {
  if (!search) return '/admin';
  return search.startsWith('?') ? `/admin${search}` : `/admin?${search}`;
}

export function adminProductsListState(search: string): AdminProductsListLocationState {
  return search ? { [ADMIN_PRODUCTS_LIST_STATE_KEY]: search } : {};
}

export function adminProductsReturnPath(
  state: unknown,
  fallbackSearch = '',
): string {
  const from =
    state &&
    typeof state === 'object' &&
    ADMIN_PRODUCTS_LIST_STATE_KEY in state &&
    typeof (state as AdminProductsListLocationState)[ADMIN_PRODUCTS_LIST_STATE_KEY] === 'string'
      ? (state as AdminProductsListLocationState)[ADMIN_PRODUCTS_LIST_STATE_KEY]
      : undefined;
  return adminProductsListPath(from ?? fallbackSearch);
}
