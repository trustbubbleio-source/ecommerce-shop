import { Button, Input, Skeleton, Spinner, cn } from '@akknerds/ui';
import { AlertCircle, PackageOpen, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import logo from '../../assets/rarity/onemorerip-logo-transparent-bg-white.png';
import { SITE } from '../../config/site';
import { useInfiniteProducts } from '../../hooks/use-products';
import { KioskProductCard } from './product-card';

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3" data-testid="kiosk-grid-loading">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="bg-card/50 overflow-hidden rounded-2xl border border-white/5">
          <Skeleton className="aspect-[5/7] w-full rounded-none" />
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-7 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function KioskBrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const [draft, setDraft] = useState(search);

  // Idle reset navigates to `/kiosk` without remounting — keep the field in sync.
  useEffect(() => {
    setDraft(search);
  }, [search]);

  const query = useMemo(() => ({ search: search || undefined, inStock: true }), [search]);
  const products = useInfiniteProducts(query);

  const flatProducts = useMemo(
    () => products.data?.pages.flatMap((page) => page.products) ?? [],
    [products.data?.pages],
  );
  const isInitialLoading = products.isLoading && !products.data;
  const isCatalogError = products.isError && !products.data;

  const applySearch = (value: string) => {
    setDraft(value);
    const next = value.trim();
    setSearchParams(next ? { search: next } : {}, { replace: true });
  };

  const clearSearch = () => applySearch('');

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="shrink-0 px-8 pb-4 pt-8">
        <Link to="/kiosk" className="mx-auto mb-5 flex justify-center" aria-label={SITE.name}>
          <img
            src={logo}
            alt={SITE.name}
            className="h-20 w-auto object-contain sm:h-24"
            draggable={false}
          />
        </Link>
        <p className="text-muted-foreground mb-2 text-center text-sm font-semibold uppercase tracking-[0.35em]">
          In-store catalogue
        </p>
        <h1 className="text-center text-5xl font-black tracking-tight sm:text-6xl">
          ONE MORE RIP
        </h1>

        <form
          className="relative mx-auto mt-8 max-w-3xl"
          onSubmit={(e) => {
            e.preventDefault();
            applySearch(draft);
          }}
        >
          <Search className="text-muted-foreground pointer-events-none absolute left-5 top-1/2 size-7 -translate-y-1/2" />
          <Input
            type="search"
            value={draft}
            onChange={(e) => applySearch(e.target.value)}
            placeholder="Search products, sets, cards…"
            aria-label="Search products"
            enterKeyHint="search"
            autoComplete="off"
            className={cn(
              'h-20 rounded-2xl border-white/10 bg-white/5 pl-16 pr-16 text-2xl',
              'placeholder:text-muted-foreground/70 focus-visible:ring-2',
            )}
          />
          {draft ? (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground absolute right-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-xl"
            >
              <X className="size-6" />
            </button>
          ) : null}
        </form>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-8 pb-10 pt-2">
        {isInitialLoading ? <GridSkeleton /> : null}

        {isCatalogError ? (
          <div className="flex flex-col items-center justify-center gap-6 py-24 text-center">
            <AlertCircle className="text-destructive size-12" aria-hidden />
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Couldn&apos;t load products</h2>
              <p className="text-muted-foreground text-xl">Check the connection and try again.</p>
            </div>
            <Button
              type="button"
              size="lg"
              className="h-16 min-w-[12rem] rounded-2xl text-xl"
              onClick={() => void products.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : null}

        {!isInitialLoading && !isCatalogError && flatProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <PackageOpen className="text-muted-foreground size-12" aria-hidden />
            <h2 className="text-3xl font-bold">No products found</h2>
            <p className="text-muted-foreground text-xl">
              {search ? 'Try another search term.' : 'Nothing in stock right now.'}
            </p>
            {search ? (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="h-14 rounded-2xl text-lg"
                onClick={clearSearch}
              >
                Clear search
              </Button>
            ) : null}
          </div>
        ) : null}

        {!isInitialLoading && !isCatalogError && flatProducts.length > 0 ? (
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
              {flatProducts.map((product) => (
                <KioskProductCard key={product.id} product={product} />
              ))}
            </div>

            {products.hasNextPage ? (
              <div className="flex justify-center pb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-16 min-w-[14rem] rounded-2xl text-xl"
                  disabled={products.isFetchingNextPage}
                  onClick={() => void products.fetchNextPage()}
                >
                  {products.isFetchingNextPage ? (
                    <Spinner className="size-6" label="Loading more" />
                  ) : (
                    'Load more'
                  )}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
