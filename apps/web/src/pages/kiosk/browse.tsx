import { Button, Input, Skeleton, Spinner, cn } from '@akknerds/ui';
import { AlertCircle, PackageOpen, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import logo from '../../assets/rarity/onemorerip-logo-transparent-bg-white.png';
import { SITE } from '../../config/site';
import { useInfiniteProducts } from '../../hooks/use-products';
import { KioskKeyboard } from './keyboard';
import { KioskProductCard } from './product-card';
import { KioskScrollRootContext } from './scroll-root';

/** Smaller pages keep swipe smoother on the portrait touchscreen. */
const KIOSK_PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 180;

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
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [scrollRoot, setScrollRoot] = useState<HTMLElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Idle reset navigates to `/kiosk` without remounting — keep the field in sync.
  useEffect(() => {
    setDraft(search);
    if (!search) setKeyboardOpen(false);
  }, [search]);

  // Debounce URL/search updates so each keypress doesn't refetch immediately.
  useEffect(() => {
    const next = draft.trim();
    const current = search.trim();
    if (next === current) return;

    const timer = window.setTimeout(() => {
      setSearchParams(next ? { search: next } : {}, { replace: true });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [draft, search, setSearchParams]);

  const query = useMemo(
    () => ({ search: search || undefined, inStock: true, limit: KIOSK_PAGE_SIZE }),
    [search],
  );
  const products = useInfiniteProducts(query);

  const flatProducts = useMemo(
    () => products.data?.pages.flatMap((page) => page.products) ?? [],
    [products.data?.pages],
  );
  const isInitialLoading = products.isLoading && !products.data;
  const isCatalogError = products.isError && !products.data;

  // Auto-load the next page when the sentinel approaches the scroll viewport.
  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !products.hasNextPage) return;

    if (typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((entry) => entry.isIntersecting) &&
          products.hasNextPage &&
          !products.isFetchingNextPage
        ) {
          void products.fetchNextPage();
        }
      },
      { root: scrollRoot, rootMargin: '400px 0px', threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    scrollRoot,
    products.hasNextPage,
    products.isFetchingNextPage,
    products.fetchNextPage,
    flatProducts.length,
  ]);

  const clearSearch = () => {
    setDraft('');
    setSearchParams({}, { replace: true });
  };

  const typeChar = (char: string) => {
    setDraft((prev) => prev + char.toLowerCase());
  };

  const backspace = () => {
    setDraft((prev) => prev.slice(0, -1));
  };

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

        <div className="relative mx-auto mt-8 max-w-3xl">
          <Search className="text-muted-foreground pointer-events-none absolute left-5 top-1/2 size-7 -translate-y-1/2" />
          <Input
            type="text"
            value={draft}
            readOnly
            inputMode="none"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Search products, sets, cards…"
            aria-label="Search products"
            aria-expanded={keyboardOpen}
            aria-controls="kiosk-keyboard"
            onFocus={() => setKeyboardOpen(true)}
            onClick={() => setKeyboardOpen(true)}
            className={cn(
              'h-20 cursor-pointer rounded-2xl border-white/10 bg-white/5 pl-16 pr-16 text-2xl',
              'placeholder:text-muted-foreground/70 focus-visible:ring-2',
              keyboardOpen && 'ring-ring ring-2',
            )}
          />
          {draft ? (
            <button
              type="button"
              onClick={() => {
                clearSearch();
                setKeyboardOpen(true);
              }}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground absolute right-4 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-xl"
            >
              <X className="size-6" />
            </button>
          ) : null}
        </div>
      </header>

      <KioskScrollRootContext.Provider value={scrollRoot}>
        <div
          ref={setScrollRoot}
          className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-8 pb-10 pt-2 [scrollbar-gutter:stable]"
        >
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
                {flatProducts.map((product, index) => (
                  <KioskProductCard
                    key={product.id}
                    product={product}
                    priority={index < 6}
                  />
                ))}
              </div>

              <div ref={loadMoreRef} className="flex min-h-10 items-center justify-center pb-4">
                {products.isFetchingNextPage ? (
                  <Spinner className="size-8" label="Loading more" />
                ) : products.hasNextPage ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-16 min-w-[14rem] rounded-2xl text-xl"
                    onClick={() => void products.fetchNextPage()}
                  >
                    Load more
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </KioskScrollRootContext.Provider>

      {keyboardOpen ? (
        <div id="kiosk-keyboard">
          <KioskKeyboard
            onType={typeChar}
            onBackspace={backspace}
            onClear={clearSearch}
            onDone={() => setKeyboardOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
