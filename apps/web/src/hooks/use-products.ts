import { type ProductsQuery, SHOP_PAGE_SIZE, api } from '@akknerds/api-client';
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { parseFilters, toProductsQuery } from '../lib/filters';

export const productKeys = {
  all: ['products'] as const,
  list: (query: ProductsQuery) => ['products', 'list', query] as const,
  infinite: (query: ProductsQuery) => ['products', 'infinite', query] as const,
  detail: (idOrSlug: string) => ['products', 'detail', idOrSlug] as const,
  meta: () => ['products', 'meta'] as const,
};

const SHOP_STALE_TIME = 60_000;

/** Warm the shop infinite-query cache (hover/focus intent prefetch). */
export function prefetchInfiniteProducts(
  queryClient: QueryClient,
  query: ProductsQuery = {},
) {
  return queryClient.prefetchInfiniteQuery({
    queryKey: productKeys.infinite(query),
    queryFn: ({ pageParam }) =>
      api.listProducts({
        ...query,
        limit: SHOP_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    staleTime: SHOP_STALE_TIME,
  });
}

/** Prefetch the first shop page for a filter query (deduped by TanStack Query). */
export function usePrefetchShopProducts() {
  const queryClient = useQueryClient();
  return (query: ProductsQuery) => {
    void prefetchInfiniteProducts(queryClient, query);
  };
}

/** Prefetch from a `/shop?...` href (nav tiles, mobile Buy shortcuts). */
export function usePrefetchShopHref() {
  const prefetch = usePrefetchShopProducts();
  return (href: string) => {
    try {
      const url = new URL(href, 'http://local');
      if (url.pathname !== '/shop') return;
      prefetch(toProductsQuery(parseFilters(url.searchParams)));
    } catch {
      // ignore malformed hrefs
    }
  };
}

export function useProducts(query: ProductsQuery = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productKeys.list(query),
    queryFn: () => api.listProducts(query),
    staleTime: SHOP_STALE_TIME,
    enabled: options?.enabled ?? true,
  });
}

/** Paginated shop catalogue — load more appends the next offset page. */
export function useInfiniteProducts(query: ProductsQuery = {}) {
  const pageSize = query.limit ?? SHOP_PAGE_SIZE;
  return useInfiniteQuery({
    queryKey: productKeys.infinite(query),
    queryFn: ({ pageParam }) =>
      api.listProducts({
        ...query,
        limit: pageSize,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastOffset) => {
      if (!lastPage.hasMore) return undefined;
      return lastOffset + pageSize;
    },
    staleTime: SHOP_STALE_TIME,
  });
}

export function useProduct(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: productKeys.detail(idOrSlug ?? ''),
    queryFn: () => api.getProduct(idOrSlug as string),
    enabled: Boolean(idOrSlug),
  });
}

export function useCatalogMeta() {
  return useQuery({
    queryKey: productKeys.meta(),
    queryFn: () => api.catalogMeta(),
    staleTime: 5 * 60_000,
  });
}
