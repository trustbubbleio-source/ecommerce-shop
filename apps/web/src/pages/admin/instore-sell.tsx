import { formatPrice } from '@akknerds/shared';
import { Spinner } from '@akknerds/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api } from '@akknerds/api-client';

type Phase = 'confirm' | 'done' | 'empty';

/**
 * Full-screen till mode: one product, one question — sold in store?
 * Payment is taken separately on the merchant Stripe reader / phone.
 */
export function AdminInstoreSellPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [phase, setPhase] = useState<Phase>('confirm');
  const [error, setError] = useState<string | null>(null);

  const productQuery = useQuery({
    queryKey: ['admin', 'instore', slug],
    queryFn: () => api.adminGetProduct(slug),
    enabled: Boolean(slug),
  });

  const product = productQuery.data?.product;

  const sell = useMutation({
    mutationFn: () => api.adminSellInStore(product!.id, { quantity: 1 }),
    onSuccess: async (data) => {
      setError(null);
      setPhase(data.product.stock <= 0 ? 'empty' : 'done');
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.setQueryData(['admin', 'instore', slug], data);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : 'Could not update stock');
    },
  });

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

  if (product.stock <= 0 && phase === 'confirm') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-black px-6 text-center text-white">
        <p className="text-sm uppercase tracking-[0.2em] text-white/50">In-store</p>
        <h1 className="max-w-sm text-2xl font-bold leading-tight">{product.name}</h1>
        <p className="text-lg text-red-400">Out of stock online</p>
        <Link
          to={`/product/${product.slug}?storefront=1`}
          className="text-sm text-white/60 underline underline-offset-4"
        >
          View product page
        </Link>
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
          <p className="text-sm text-white/45">Take payment on Stripe as usual.</p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-3">
          {product.stock > 0 && (
            <button
              type="button"
              className="rounded-2xl bg-white px-6 py-4 text-lg font-bold text-black active:scale-[0.98]"
              onClick={() => {
                setPhase('confirm');
                setError(null);
              }}
            >
              Sell another
            </button>
          )}
          <Link
            to={`/product/${product.slug}?storefront=1`}
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
          {formatPrice(product.price, product.currency)}
        </p>
        <p className="text-sm text-white/55">
          Online stock: <span className="text-white">{product.stock}</span>
        </p>
      </div>

      <p className="text-lg font-medium text-white/90">Sold in store?</p>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex w-full max-w-xs flex-col gap-3">
        <button
          type="button"
          disabled={sell.isPending}
          className="rounded-2xl bg-white px-6 py-5 text-xl font-bold text-black disabled:opacity-60 active:scale-[0.98]"
          onClick={() => sell.mutate()}
        >
          {sell.isPending ? 'Saving…' : 'Yes'}
        </button>
        <button
          type="button"
          disabled={sell.isPending}
          className="rounded-2xl border border-white/30 px-6 py-5 text-xl font-semibold text-white active:scale-[0.98]"
          onClick={() => navigate(`/product/${product.slug}?storefront=1`)}
        >
          No
        </button>
      </div>
    </div>
  );
}
