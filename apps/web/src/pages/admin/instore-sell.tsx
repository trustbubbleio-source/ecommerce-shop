import { formatMoney } from '@akknerds/shared';
import { Spinner } from '@akknerds/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api } from '@akknerds/api-client';

type Phase = 'confirm' | 'done' | 'empty';

/**
 * Full-screen till helper for card/cash logged in-app.
 * Card-terminal / Swish / live inventory for walk-ins: use Zettle POS.
 */
export function AdminInstoreSellPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>('confirm');
  const [error, setError] = useState<string | null>(null);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const productQuery = useQuery({
    queryKey: ['admin', 'instore', slug],
    queryFn: () => api.adminGetProduct(slug),
    enabled: Boolean(slug),
  });

  const product = productQuery.data?.product;

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

  const busy = sellCard.isPending;

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
        <p className="max-w-sm text-sm text-white/55">
          Prefer Zettle POS for live inventory. Sync stock from Zettle if this looks wrong.
        </p>
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

  if (phase === 'done' || phase === 'empty') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-400/80">Sold</p>
        <h1 className="max-w-sm text-2xl font-bold leading-tight">{product.name}</h1>
        <p className="text-white/70">
          Stock left: <span className="font-semibold text-white">{product.stock}</span>
        </p>
        {lastOrderId && (
          <p className="font-mono text-xs text-white/40">{lastOrderId}</p>
        )}
        {phase === 'empty' ? (
          <p className="text-amber-300">This product is now out of stock in the web catalogue.</p>
        ) : (
          <button
            type="button"
            className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-black"
            onClick={() => setPhase('confirm')}
          >
            Sell another
          </button>
        )}
        <Link to="/admin" className="text-sm text-white/60 underline underline-offset-4">
          Back to admin
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-black px-6 text-center text-white">
      <div className="flex flex-col items-center gap-2">
        <p className="text-sm uppercase tracking-[0.2em] text-white/50">In-store</p>
        <h1 className="max-w-sm text-3xl font-bold leading-tight">{product.name}</h1>
        <p className="text-2xl font-semibold text-emerald-400">{formatMoney(product.price)}</p>
        <p className="text-sm text-white/50">
          {product.stock} in web catalogue · card/cash log only
        </p>
        <p className="max-w-sm text-xs text-white/40">
          For Swish / card terminal / shared stock with the shop, sell in Zettle POS instead.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        disabled={busy}
        className="rounded-xl bg-white px-10 py-5 text-xl font-semibold text-black disabled:opacity-50"
        onClick={() => sellCard.mutate()}
      >
        {busy ? 'Saving…' : 'Log card / cash sale'}
      </button>

      <Link to="/admin" className="text-sm text-white/60 underline underline-offset-4">
        Cancel
      </Link>
    </div>
  );
}
