import type { UpdateOrderFulfillmentInput } from '@akknerds/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@akknerds/api-client';
import { useAuthStore } from '../store/auth';

export const orderKeys = {
  detail: (id: string) => ['orders', 'detail', id] as const,
  mine: () => ['orders', 'mine'] as const,
  admin: () => ['orders', 'admin'] as const,
  adminDetail: (id: string) => ['orders', 'admin', id] as const,
};

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: () => api.getOrder(id as string),
    enabled: Boolean(id),
    retry: false,
  });
}

export function useMyOrders() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: orderKeys.mine(),
    queryFn: () => api.myOrders(),
    enabled: Boolean(token),
  });
}

export function useAdminOrders() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: orderKeys.admin(),
    queryFn: () => api.adminListOrders(),
    enabled: Boolean(token && user?.role === 'admin'),
  });
}

export function useAdminOrder(id: string | undefined) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: orderKeys.adminDetail(id ?? ''),
    queryFn: () => api.adminGetOrder(id as string),
    enabled: Boolean(id && token && user?.role === 'admin'),
    retry: false,
  });
}

export function useAdminUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateOrderFulfillmentInput }) =>
      api.adminUpdateOrder(id, input),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.admin() });
      void queryClient.invalidateQueries({ queryKey: orderKeys.adminDetail(id) });
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
    },
  });
}
