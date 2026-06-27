import { useQuery } from '@tanstack/react-query';
import { type ProductsQuery, api } from '../lib/api';

export const productKeys = {
  all: ['products'] as const,
  list: (query: ProductsQuery) => ['products', 'list', query] as const,
  detail: (idOrSlug: string) => ['products', 'detail', idOrSlug] as const,
  meta: () => ['products', 'meta'] as const,
};

export function useProducts(query: ProductsQuery = {}) {
  return useQuery({
    queryKey: productKeys.list(query),
    queryFn: () => api.listProducts(query),
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
