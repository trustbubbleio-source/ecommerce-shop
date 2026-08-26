import { SORT_OPTIONS } from '@akknerds/shared';
import {
  Button,
  Input,
  Select,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Spinner,
} from '@akknerds/ui';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/common/page-header';
import { ProductFiltersPanel } from '../components/product/product-filters';
import { ProductGrid } from '../components/product/product-grid';
import { useCatalogMeta, useInfiniteProducts } from '../hooks/use-products';
import {
  type ProductFilters,
  filtersToParams,
  parseFilters,
  toProductsQuery,
} from '../lib/filters';

export function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const query = useMemo(() => toProductsQuery(filters), [filters]);

  const meta = useCatalogMeta();
  const products = useInfiniteProducts(query);

  const update = (patch: Partial<ProductFilters>) => {
    setSearchParams(filtersToParams({ ...filters, ...patch }), { replace: true });
  };
  const reset = () => setSearchParams(new URLSearchParams());

  const flatProducts = useMemo(
    () => products.data?.pages.flatMap((page) => page.products) ?? [],
    [products.data?.pages],
  );
  const total = products.data?.pages[0]?.total ?? 0;
  const loaded = flatProducts.length;
  const isInitialLoading = products.isLoading && !products.data;

  return (
    <div className="container py-8">
      <PageHeader
        title="Buy"
        description="Browse our full catalogue of sealed product and singles."
      />

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <ProductFiltersPanel
              meta={meta.data}
              value={filters}
              onChange={update}
              onReset={reset}
            />
          </div>
        </aside>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <Input
                type="search"
                value={filters.search}
                onChange={(e) => update({ search: e.target.value })}
                placeholder="Search products, sets, artistsâ€¦"
                aria-label="Search products"
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-2">
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden" aria-label="Open filters">
                    <SlidersHorizontal /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[85vh] gap-0 overflow-y-auto p-0">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="p-5 pt-4">
                    <ProductFiltersPanel
                      meta={meta.data}
                      value={filters}
                      onChange={update}
                      onReset={reset}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <Select
                aria-label="Sort products"
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value as ProductFilters['sort'] })}
                options={SORT_OPTIONS}
                className="w-full sm:w-52"
              />
            </div>
          </div>

          <p className="text-muted-foreground text-sm" aria-live="polite">
            {isInitialLoading
              ? 'Loadingâ€¦'
              : total === 0
                ? '0 products'
                : loaded < total
                  ? `Showing ${loaded} of ${total} products`
                  : `${total} product${total === 1 ? '' : 's'}`}
          </p>

          <ProductGrid
            products={flatProducts}
            isLoading={isInitialLoading}
            skeletonCount={8}
          />

          {products.hasNextPage ? (
            <div className="flex justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="min-w-44"
                disabled={products.isFetchingNextPage}
                onClick={() => void products.fetchNextPage()}
              >
                {products.isFetchingNextPage ? (
                  <>
                    <Spinner /> Loadingâ€¦
                  </>
                ) : (
                  'Load more'
                )}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
