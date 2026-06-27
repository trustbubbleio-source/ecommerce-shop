import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/auth';

export const orderKeys = {
  detail: (id: string) => ['orders', 'detail', id] as const,
  mine: () => ['orders', 'mine'] as const,
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
