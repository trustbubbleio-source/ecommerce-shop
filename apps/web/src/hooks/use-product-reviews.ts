import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateProductReviewInput } from '@akknerds/shared';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { productKeys } from './use-products';

export const reviewKeys = {
  all: () => ['product-reviews'] as const,
  product: (idOrSlug: string) => ['product-reviews', idOrSlug] as const,
};

export function useProductReviews(idOrSlug: string | undefined) {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: reviewKeys.product(idOrSlug ?? ''),
    queryFn: () => api.listProductReviews(idOrSlug!),
    enabled: Boolean(token && idOrSlug),
    staleTime: 30_000,
  });
}

export function useCreateProductReview(idOrSlug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateProductReviewInput) => api.createProductReview(idOrSlug, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewKeys.product(idOrSlug) });
      void queryClient.invalidateQueries({ queryKey: productKeys.detail(idOrSlug) });
    },
  });
}
