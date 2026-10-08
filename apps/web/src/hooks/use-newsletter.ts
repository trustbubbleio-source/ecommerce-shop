import { api } from '@akknerds/api-client';
import type { NewsletterSubscribeInput } from '@akknerds/shared';
import { useMutation } from '@tanstack/react-query';

export function useNewsletterSubscribe() {
  return useMutation({
    mutationFn: (input: NewsletterSubscribeInput) => api.subscribeNewsletter(input),
  });
}
