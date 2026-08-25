import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';

export const favoriteKeys = {
  all: () => ['favorites'] as const,
  ids: () => ['favorites', 'ids'] as const,
  list: () => ['favorites', 'list'] as const,
};

export function useFavoriteIds() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: favoriteKeys.ids(),
    queryFn: async () => {
      const { productIds } = await api.listFavoriteIds();
      return new Set(productIds);
    },
    enabled: Boolean(token),
    staleTime: 30_000,
  });
}

export function useFavoriteProducts() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: favoriteKeys.list(),
    queryFn: () => api.listFavorites(),
    enabled: Boolean(token),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, isFavorite }: { productId: string; isFavorite: boolean }) => {
      if (isFavorite) return api.removeFavorite(productId);
      return api.addFavorite(productId);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(favoriteKeys.ids(), new Set(data.productIds));
      void queryClient.invalidateQueries({ queryKey: favoriteKeys.list() });
    },
  });
}
