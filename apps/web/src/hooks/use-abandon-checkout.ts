import { api } from '@akknerds/api-client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * When Stripe cancel_url lands on /cart?order_id=…, cancel the pending
 * reservation so stock is restored before cart reconcile runs.
 */
export function useAbandonCheckout(): 'idle' | 'loading' | 'done' {
  const [params, setParams] = useSearchParams();
  const orderId = params.get('order_id');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>(() =>
    orderId ? 'loading' : 'done',
  );

  useEffect(() => {
    if (!orderId) {
      setStatus('done');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    void (async () => {
      try {
        await api.abandonOrder(orderId);
      } catch {
        // Best-effort: session may already be expired/cancelled.
      } finally {
        if (cancelled) return;
        setParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.delete('order_id');
            return next;
          },
          { replace: true },
        );
        setStatus('done');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, setParams]);

  return status;
}
