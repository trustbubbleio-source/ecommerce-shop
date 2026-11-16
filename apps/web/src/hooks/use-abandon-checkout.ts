import { api } from '@akknerds/api-client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCheckoutStore } from '../store/checkout';

/**
 * When cancel_url lands on /cart?order_id=…, cancel the pending reservation
 * so stock is restored before cart reconcile runs. Also abandons a pending
 * order stored in the checkout session when the buyer returns to the cart.
 */
export function useAbandonCheckout(): 'idle' | 'loading' | 'done' {
  const [params, setParams] = useSearchParams();
  const orderIdFromUrl = params.get('order_id');
  const storedOrderId = useCheckoutStore((s) => s.orderId);
  const clearCheckout = useCheckoutStore((s) => s.clear);
  const orderId = orderIdFromUrl ?? storedOrderId;
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
        clearCheckout();
        if (orderIdFromUrl) {
          setParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.delete('order_id');
              return next;
            },
            { replace: true },
          );
        }
        setStatus('done');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId, orderIdFromUrl, setParams, clearCheckout]);

  return status;
}
