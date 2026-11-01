import { formatMoney } from '@akknerds/shared';
import { Spinner } from '@akknerds/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiError, api } from '@akknerds/api-client';

type Phase = 'confirm' | 'done' | 'empty' | 'cancelled' | 'awaiting';

/**
 * Full-screen till mode: sell with card (manual Stripe) or Swish (Stripe Checkout QR).
 */
export function AdminInstoreSellPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>('confirm');
  const [error, setError] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const paidReturn = searchParams.get('paid') === '1';
  const cancelledReturn = searchParams.get('cancelled') === '1';
  const returnOrderId = searchParams.get('order_id');

  const productQuery = useQuery({
    queryKey: ['admin', 'instore', slug],
    queryFn: () => api.adminGetProduct(slug),
    enabled: Boolean(slug),
  });

  const product = productQuery.data?.product;

  // Returning from Stripe Checkout success / cancel.
  useEffect(() => {
    if (!returnOrderId) return;

    if (cancelledReturn) {
      void api.abandonOrder(returnOrderId).catch(() => undefined);
      setLastOrderId(returnOrderId);
      setPhase('cancelled');
      setSearchParams({}, { replace: true });
      return;
    }

    if (paidReturn) {
      setLastOrderId(returnOrderId);
      setPhase('awaiting');
      setSearchParams({}, { replace: true });
    }
  }, [paidReturn, cancelledReturn, returnOrderId, setSearchParams]);

  // Poll until Swish webhook (or mock settle) marks the order fulfilled.
  const settleQuery = useQuery({
    queryKey: ['admin', 'instore-order', lastOrderId],
    queryFn: () => api.adminGetOrder(lastOrderId!),
    enabled: phase === 'awaiting' && Boolean(lastOrderId),
    refetchInterval: (q) => {
      const status = q.state.data?.order.status;
      if (status === 'fulfilled' || status === 'paid' || status === 'cancelled') return false;
      return 1500;
    },
  });

  useEffect(() => {
    if (phase !== 'awaiting') return;
    const status = settleQuery.data?.order.status;
    if (status === 'fulfilled' || status === 'paid') {
      void (async () => {
        await queryClient.invalidateQueries({ queryKey: ['products'] });
        await queryClient.invalidateQueries({ queryKey: ['admin'] });
        const refreshed = await productQuery.refetch();
        const stock = refreshed.data?.product.stock ?? 0;
        setPhase(stock <= 0 ? 'empty' : 'done');
      })();
    }
    if (status === 'cancelled') {
      setPhase('cancelled');
    }
  }, [phase, settleQuery.data?.order.status, productQuery, queryClient]);

  const sellCard = useMutation({
    mutationFn: () =>
      api.adminSellInStore(product!.id, { quantity: 1, paymentMethod: 'card_manual' }),
    onSuccess: async (data) => {
      setError(null);
      setLastOrderId(data.order.id);
      setPhase(data.product.stock <= 0 ? 'empty' : 'done');
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.setQueryData(['admin', 'instore', slug], { product: data.product });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not update stock');
    },
  });

  const sellSwish = useMutation({
    mutationFn: () =>
      api.adminSellInStore(product!.id, { quantity: 1, paymentMethod: 'swish' }),
    onSuccess: async (data) => {
      setError(null);
      setLastOrderId(data.order.id);
      queryClient.setQueryData(['admin', 'instore', slug], { product: data.product });
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      // Mock settled without redirect URL (should not happen).
      setPhase(data.product.stock <= 0 ? 'empty' : 'done');
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not start Swish');
    },
  });

  const busy = sellCard.isPending || sellSwish.isPending;

  if (productQuery.isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black text-white">
        <Spinner className="size-8 text-white" label="Loading product" />
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
        <p className="text-lg font-semibold">Product not found</p>
        <button
          type="button"
          className="rounded-xl border border-white/30 px-6 py-3 text-base font-medium"
          onClick={() => navigate('/admin')}
        >
          Back to admin
        </button>
      </div>
    );
  }

  if (product.inactive && phase === 'confirm') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
        <p className="text-sm uppercase tracking-[0.2em] text-white/50">In-store</p>
        <h1 className="max-w-sm text-2xl font-bold leading-tight">{product.name}</h1>
        <p className="text-lg text-red-400">Product is inactive</p>
        <p className="max-w-sm text-sm text-white/55">
          Reactivate it in admin before selling in store.
        </p>
        <Link
          to={`/admin/products/${product.id}`}
          className="text-sm text-white/60 underline underline-offset-4"
        >
          Open in admin
        </Link>
      </div>
    );
  }

  if (product.stock <= 0 && phase === 'confirm') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
        <p className="text-sm uppercase tracking-[0.2em] text-white/50">In-store</p>
        <h1 className="max-w-sm text-2xl font-bold leading-tight">{product.name}</h1>
        <p className="text-lg text-red-400">Out of stock online</p>
        {!product.storeOnly && (
          <Link
            to={`/product/${product.slug}?storefront=1`}
            className="text-sm text-white/60 underline underline-offset-4"
          >
            View product page
          </Link>
        )}
      </div>
    );
  }

  if (phase === 'awaiting') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
        <Spinner className="size-8 text-white" label="Confirming Swish payment" />
        <p className="text-lg font-medium">Confirming Swish payment…</p>
        <p className="max-w-sm text-sm text-white/55">
          Waiting for Stripe. Keep this screen open.
        </p>
        {lastOrderId && (
          <p className="font-mono text-xs text-white/40">{lastOrderId}</p>
        )}
      </div>
    );
  }

  if (phase === 'cancelled') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-black px-6 text-center text-white">
        <div className="flex flex-col gap-3">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-400/90">Payment cancelled</p>
          <h1 className="max-w-sm text-2xl font-bold leading-tight">{product.name}</h1>
          <p className="text-sm text-white/55">
            Swish was not completed. Stock has been restored if the order was still pending.
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            className="rounded-2xl bg-white px-6 py-4 text-lg font-bold text-black active:scale-[0.98]"
            onClick={() => {
              setPhase('confirm');
              setError(null);
              setLastOrderId(null);
              void productQuery.refetch();
            }}
          >
            Try again
          </button>
          <Link
            to={
              product.storeOnly
                ? '/admin/products'
                : `/product/${product.slug}?storefront=1`
            }
            className="rounded-2xl border border-white/25 px-6 py-4 text-lg font-medium text-white"
          >
            Done
          </Link>
        </div>
      </div>
    );
  }

  if (phase === 'done' || phase === 'empty') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-black px-6 text-center text-white">
        <div className="flex flex-col gap-3">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-400/90">Sold in store</p>
          <h1 className="max-w-sm text-2xl font-bold leading-tight">{product.name}</h1>
          <p className="text-white/70">
            Stock left online:{' '}
            <span className="font-semibold text-white">{product.stock}</span>
          </p>
          {lastOrderId && (
            <p className="font-mono text-xs text-white/50">{lastOrderId}</p>
          )}
          <p className="text-sm text-white/45">
            Recorded under Orders → Finished.
          </p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-3">
          {product.stock > 0 && (
            <button
              type="button"
              className="rounded-2xl bg-white px-6 py-4 text-lg font-bold text-black active:scale-[0.98]"
              onClick={() => {
                setPhase('confirm');
                setError(null);
                setLastOrderId(null);
              }}
            >
              Sell another
            </button>
          )}
          {lastOrderId && (
            <Link
              to={`/admin/orders/${lastOrderId}`}
              className="rounded-2xl border border-white/25 px-6 py-4 text-lg font-medium text-white"
            >
              View order
            </Link>
          )}
          <Link
            to={
              product.storeOnly
                ? '/admin/products'
                : `/product/${product.slug}?storefront=1`
            }
            className="rounded-2xl border border-white/25 px-6 py-4 text-lg font-medium text-white"
          >
            Done
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-black px-6 text-center text-white">
      <div className="flex flex-col gap-3">
        <p className="text-sm uppercase tracking-[0.2em] text-white/45">In-store sale</p>
        <h1 className="max-w-sm text-2xl font-bold leading-tight sm:text-3xl">{product.name}</h1>
        <p className="text-xl font-semibold tabular-nums">
          {formatMoney(product.price, 'sek')}
        </p>
        <p className="text-sm text-white/55">
          Online stock: <span className="text-white">{product.stock}</span>
        </p>
      </div>

      <p className="text-lg font-medium text-white/90">How will they pay?</p>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          disabled={busy}
          className="rounded-2xl bg-white px-6 py-5 text-xl font-bold text-black disabled:opacity-60 active:scale-[0.98]"
          onClick={() => sellCard.mutate()}
        >
          {sellCard.isPending ? 'Saving…' : 'Card'}
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-2xl border border-emerald-400/50 bg-emerald-500/15 px-6 py-5 text-xl font-bold text-emerald-200 disabled:opacity-60 active:scale-[0.98]"
          onClick={() => sellSwish.mutate()}
        >
          {sellSwish.isPending ? 'Opening Swish…' : 'Swish'}
        </button>
        <button
          type="button"
          disabled={busy}
          className="rounded-2xl border border-white/30 px-6 py-5 text-xl font-semibold text-white active:scale-[0.98]"
          onClick={() =>
            navigate(
              product.storeOnly ? '/admin/products' : `/product/${product.slug}?storefront=1`,
            )
          }
        >
          Cancel
        </button>
      </div>
      <p className="max-w-xs text-xs text-white/40">
        Card: take payment on Stripe as usual. Swish: customer scans the QR on the next screen.
      </p>
    </div>
  );
}
