import { api } from '@akknerds/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';

export const notificationKeys = {
  all: ['notifications'] as const,
  mine: () => [...notificationKeys.all, 'mine'] as const,
};

export function useNotifications() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: notificationKeys.mine(),
    queryFn: () => api.listNotifications(),
    enabled: Boolean(token),
    refetchInterval: token ? 30_000 : false,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids?: string[]) => api.markNotificationsRead(ids),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.mine() });
    },
  });
}
