import { api } from '@akknerds/api-client';
import { useEffect, useState } from 'react';
import { toCartProduct, useCartStore } from '../store/cart';

/**
 * Re-fetch cart line products on mount so price/stock match the catalogue
 * before the customer sees totals or proceeds to checkout (L6).
 */
export function useReconcileCart() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    const { items, reconcile } = useCartStore.getState();
    if (items.length === 0) {
      setStatus('done');
      return;
    }

    let cancelled = false;
    setStatus('loading');

    void (async () => {
      try {
        const entries = await Promise.all(
          items.map(async (item) => {
            try {
              const { product } = await api.getProduct(item.product.id);
              return [item.product.id, toCartProduct(product)] as const;
            } catch {
              return [item.product.id, null] as const;
            }
          }),
        );
        if (cancelled) return;
        reconcile(new Map(entries));
        setStatus('done');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
