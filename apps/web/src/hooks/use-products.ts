import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { type ProductsQuery, SHOP_PAGE_SIZE, api } from '@akknerds/api-client';

export const productKeys = {
  all: ['products'] as const,
  list: (query: ProductsQuery) => ['products', 'list', query] as const,
  infinite: (query: ProductsQuery) => ['products', 'infinite', query] as const,
  detail: (idOrSlug: string) => ['products', 'detail', idOrSlug] as const,
  meta: () => ['products', 'meta'] as const,
};

export function useProducts(query: ProductsQuery = {}, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: productKeys.list(query),
    queryFn: () => api.listProducts(query),
    staleTime: 60_000,
    enabled: options?.enabled ?? true,
  });
}

/** Paginated shop catalogue — load more appends the next offset page. */
export function useInfiniteProducts(query: ProductsQuery = {}) {
  return useInfiniteQuery({
    queryKey: productKeys.infinite(query),
    queryFn: ({ pageParam }) =>
      api.listProducts({
        ...query,
        limit: SHOP_PAGE_SIZE,
        offset: pageParam,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _pages, lastOffset) => {
      if (!lastPage.hasMore) return undefined;
      return lastOffset + SHOP_PAGE_SIZE;
    },
    staleTime: 60_000,
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
