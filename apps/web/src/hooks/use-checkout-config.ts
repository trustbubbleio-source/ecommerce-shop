import { api } from '@akknerds/api-client';
import { useQuery } from '@tanstack/react-query';

export function useCheckoutConfig() {
  return useQuery({
    queryKey: ['checkout-config'],
    queryFn: () => api.getCheckoutConfig(),
    staleTime: Infinity,
  });
}
