import type { CheckoutInput } from '@akknerds/shared';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useCheckout() {
  return useMutation({
    mutationFn: (input: CheckoutInput) => api.checkout(input),
  });
}
