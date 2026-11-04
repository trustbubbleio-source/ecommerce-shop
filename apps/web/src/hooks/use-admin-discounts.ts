import type { CreateDiscountCodeInput } from '@akknerds/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@akknerds/api-client';
import { useAuthStore } from '../store/auth';

export const adminDiscountKeys = {
  all: ['admin', 'discounts'] as const,
  users: (q: string) => ['admin', 'discount-users', q] as const,
};

export function useAdminDiscounts() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: adminDiscountKeys.all,
    queryFn: () => api.adminListDiscounts(),
    enabled: Boolean(token && user?.role === 'admin'),
  });
}

export function useAdminSearchUsers(query: string) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const q = query.trim();
  return useQuery({
    queryKey: adminDiscountKeys.users(q),
    queryFn: () => api.adminSearchUsers(q),
    enabled: Boolean(token && user?.role === 'admin' && q.length >= 2),
  });
}

export function useAdminCreateDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDiscountCodeInput) => api.adminCreateDiscount(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminDiscountKeys.all });
    },
  });
}

export function useAdminSetDiscountActive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.adminSetDiscountActive(id, active),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminDiscountKeys.all });
    },
  });
}

export function useAdminDeleteDiscount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.adminDeleteDiscount(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminDiscountKeys.all });
    },
  });
}
