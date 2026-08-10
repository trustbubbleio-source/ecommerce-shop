import {
  categoryLabel,
  formatPrice,
  primaryProductImage,
  type Product,
} from '@akknerds/shared';
import { Input, Spinner, cn } from '@akknerds/ui';
import { ArrowRight, Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORY_TILES } from '../../config/site';
import { useProducts } from '../../hooks/use-products';

const QUICK_LINKS = CATEGORY_TILES.slice(0, 5).map((tile) => ({
  label: tile.label,
  href: `/shop?category=${tile.category}`,
}));

const SUGGESTED_QUERIES = ['151', 'Charizard', 'ETB', 'PSA'] as const;

/** Above header (40) and chat (40); fully owns the viewport while open. */
const SEARCH_Z = 'z-[100]';

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function ResultRow({
  product,
  onNavigate,
}: {
  product: Product;
  onNavigate: () => void;
}) {
  const image = primaryProductImage(product);
  return (
    <Link
      to={`/product/${product.slug}`}
      onClick={onNavigate}
      className="hover:bg-secondary/80 flex items-center gap-3 rounded-lg px-2 py-2 transition-colors"
    >
      <div className="bg-muted size-12 shrink-0 overflow-hidden rounded-md">
        {image ? (
          <img src={image} alt="" className="size-full object-contain" loading="lazy" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{product.name}</p>
        <p className="text-muted-foreground truncate text-xs">
          {categoryLabel(product.category)}
          {product.set ? ` · ${product.set}` : ''}
        </p>
      </div>
      <span className="text-foreground shrink-0 text-sm font-semibold">
        {formatPrice(product.price, product.currency)}
      </span>
    </Link>
  );
}

/**
 * Standalone search overlay (not the shared Dialog).
 * Centered with flex — no transform animations that fight positioning.
 */
export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query.trim(), 280);
  const navigate = useNavigate();
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const canSearch = debouncedQuery.length >= 2;

  const results = useProducts(
    { search: debouncedQuery, limit: 6 },
    { enabled: open && canSearch },
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', onKeyDown, true);
      triggerRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  function close() {
    setOpen(false);
  }

  function goToShopSearch(term: string) {
    const trimmed = term.trim();
    close();
    navigate(trimmed ? `/shop?search=${encodeURIComponent(trimmed)}` : '/shop');
  }

  const products = results.data?.products ?? [];
  const showIdle = !canSearch;
  const showLoading = canSearch && results.isPending;
  const showEmpty = canSearch && !results.isPending && products.length === 0;
  const showResults = canSearch && products.length > 0;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Search"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex size-11 items-center justify-center rounded-lg text-sm font-semibold transition-all',
          'hover:bg-secondary focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'active:scale-[0.98]',
        )}
      >
        <Search className="size-4" />
      </button>

      {open
        ? createPortal(
            <div className={cn('fixed inset-0 flex items-center justify-center p-4', SEARCH_Z)}>
              <button
                type="button"
                aria-label="Close search"
                className="absolute inset-0 bg-black/70"
                onClick={close}
              />

              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="border-border bg-popover text-popover-foreground relative flex w-full max-w-xl flex-col overflow-hidden rounded-xl border shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id={titleId} className="sr-only">
                  Search products
                </h2>

                <form
                  className="border-border flex items-center gap-2 border-b px-3 py-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    goToShopSearch(query);
                  }}
                >
                  <Search className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  <Input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search products, sets, cards…"
                    aria-label="Search products"
                    className="border-0 bg-transparent shadow-none focus-visible:ring-0"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={close}
                    className="text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-ring shrink-0 rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2"
                  >
                    <X className="size-5" />
                  </button>
                </form>

                <div className="max-h-[min(60vh,24rem)] overflow-y-auto p-3">
                  {showIdle ? (
                    <div className="flex flex-col gap-4">
                      <div>
                        <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
                          Browse
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {QUICK_LINKS.map((link) => (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={close}
                              className="border-border hover:bg-secondary rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-2 text-xs font-semibold uppercase tracking-wide">
                          Try searching
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {SUGGESTED_QUERIES.map((term) => (
                            <button
                              key={term}
                              type="button"
                              className="border-border hover:bg-secondary rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                              onClick={() => setQuery(term)}
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {showLoading ? (
                    <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
                      <Spinner className="size-4" />
                      Searching…
                    </div>
                  ) : null}

                  {showEmpty ? (
                    <div className="flex flex-col items-center gap-3 py-8 text-center">
                      <p className="text-sm font-medium">No products match “{debouncedQuery}”</p>
                      <button
                        type="button"
                        className="text-primary inline-flex items-center gap-1 text-sm font-semibold hover:underline"
                        onClick={() => goToShopSearch(debouncedQuery)}
                      >
                        Search the full shop
                        <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  ) : null}

                  {showResults ? (
                    <div className="flex flex-col gap-1">
                      {products.map((product) => (
                        <ResultRow key={product.id} product={product} onNavigate={close} />
                      ))}
                      <button
                        type="button"
                        className="text-primary hover:bg-secondary mt-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-sm font-semibold transition-colors"
                        onClick={() => goToShopSearch(debouncedQuery)}
                      >
                        View all results
                        <ArrowRight className="size-3.5" />
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
