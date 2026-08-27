import type { CreateWantListItemInput, UpdateWantListStatusInput } from '@akknerds/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@akknerds/api-client';
import { useAuthStore } from '../store/auth';

export const wantListKeys = {
  all: () => ['want-list'] as const,
  mine: () => ['want-list', 'mine'] as const,
  admin: () => ['want-list', 'admin'] as const,
};

export function useWantList() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: wantListKeys.mine(),
    queryFn: () => api.listWantList(),
    enabled: Boolean(token),
  });
}

export function useCreateWantListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWantListItemInput) => api.createWantListItem(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wantListKeys.mine() });
    },
  });
}

export function useRemoveWantListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeWantListItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wantListKeys.mine() });
    },
  });
}

export function useAdminWantList() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: wantListKeys.admin(),
    queryFn: () => api.adminListWantList(),
    enabled: Boolean(token && user?.role === 'admin'),
  });
}

export function useAdminUpdateWantListItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateWantListStatusInput }) =>
      api.adminUpdateWantListItem(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wantListKeys.admin() });
    },
  });
}
