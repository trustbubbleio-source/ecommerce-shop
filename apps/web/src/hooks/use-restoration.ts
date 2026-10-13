import type { UpdateRestorationStatusInput } from '@akknerds/shared';
import { api } from '@akknerds/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth';

export const restorationKeys = {
  admin: () => ['restoration', 'admin'] as const,
};

export function useSubmitRestoration() {
  return useMutation({
    mutationFn: (formData: FormData) => api.submitRestorationRequest(formData),
  });
}

export function useAdminRestorationSubmissions() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: restorationKeys.admin(),
    queryFn: () => api.adminListRestorationSubmissions(),
    enabled: Boolean(token && user?.role === 'admin'),
  });
}

export function useAdminUpdateRestorationSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRestorationStatusInput }) =>
      api.adminUpdateRestorationSubmission(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: restorationKeys.admin() });
    },
  });
}
