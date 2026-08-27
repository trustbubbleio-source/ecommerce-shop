import type { ContactInput } from '@akknerds/shared';
import { useMutation } from '@tanstack/react-query';
import { api } from '@akknerds/api-client';

export function useContact() {
  return useMutation({
    mutationFn: (input: ContactInput) => api.contact(input),
  });
}
