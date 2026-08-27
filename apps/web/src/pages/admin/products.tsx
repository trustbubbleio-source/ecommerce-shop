import {
  categoryLabel,
  formatPrice,
  primaryProductImage,
  resolveAssetUrl,
  type CatalogStats,
  type Product,
} from '@akknerds/shared';
import { ADMIN_PRODUCTS_PAGE_SIZE, api, type AdminProductSortKey } from '@akknerds/api-client';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Skeleton } from '@akknerds/ui';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ArrowUpDown, Boxes, ImagePlus, Package, RefreshCw, Search, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type SortDir = 'asc' | 'desc';

const EMPTY_CATALOG_STATS: CatalogStats = {
  listings: 0,
  unitsInStock: 0,
  inventoryValueCents: 0,
};

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

function CatalogStatsRow({
  stats,
  isLoading,
}: {
  stats: CatalogStats;
  isLoading: boolean;
}) {
  const items = [
    {
      label: 'Listings',
      value: stats.listings.toLocaleString(),
      hint: 'Products in catalog',
      icon: Package,
    },
    {
      label: 'Units in stock',
      value: stats.unitsInStock.toLocaleString(),
      hint: 'Total items available',
      icon: Boxes,
    },
    {
      label: 'Inventory value',
      value: formatPrice(stats.inventoryValueCents),
      hint: 'Sum of price × stock (full catalog)',
      icon: Wallet,
    },
  ] as const;

  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <Card key={item.label} className="bg-card/60">
            <CardContent className="flex items-center gap-3 p-4">
              <Skeleton className="size-9 shrink-0 rounded-lg" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {items.map(({ label, value, hint, icon: Icon }) => (
        <Card key={label} className="bg-card/60">
          <CardContent className="flex items-center gap-3 p-4">
            <span className="bg-primary/15 text-primary grid size-9 shrink-0 place-items-center rounded-lg">
              <Icon className="size-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium">{label}</p>
              <p className="text-foreground text-lg font-bold tracking-tight">{value}</p>
              <p className="text-muted-foreground truncate text-[11px]">{hint}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="size-3.5 opacity-50" aria-hidden />;
  return dir === 'asc' ? (
    <ArrowUp className="size-3.5" aria-hidden />
  ) : (
    <ArrowDown className="size-3.5" aria-hidden />
  );
}

export function AdminProductsPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim(), 280);
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<AdminProductSortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  const products = useQuery({
    queryKey: ['admin', 'products', { search: debouncedSearch, page, sortKey, sortDir }],
    queryFn: () =>
      api.adminListProducts({
        search: debouncedSearch || undefined,
        limit: ADMIN_PRODUCTS_PAGE_SIZE,
        offset: page * ADMIN_PRODUCTS_PAGE_SIZE,
        sortKey,
        sortDir,
      }),
    placeholderData: keepPreviousData,
  });

  const priceSync = useMutation({
    mutationFn: () => api.adminSyncPrices(),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      const { summary } = result;
      setSyncMessage(
        `Prices synced: ${summary.updated} updated, ${summary.skipped} unchanged, ${summary.errors} failed.`,
      );
    },
    onError: () => {
      setSyncMessage('Price sync failed. Try again in a moment.');
    },
  });

  const rows: Product[] = products.data?.products ?? [];
  const total = products.data?.total ?? 0;
  const catalogStats = products.data?.stats ?? EMPTY_CATALOG_STATS;
  // Use the loaded page's offset so keepPreviousData doesn't flash a mismatched range.
  const offset = products.data?.offset ?? 0;
  const from = total === 0 ? 0 : offset + 1;
  const to = offset + rows.length;
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_PRODUCTS_PAGE_SIZE));
  const shownPage = Math.floor(offset / ADMIN_PRODUCTS_PAGE_SIZE);

  const toggleSort = (key: AdminProductSortKey) => {
    setPage(0);
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  const cdn = import.meta.env.VITE_ASSET_CDN_URL;

  const columns: { key: AdminProductSortKey; label: string }[] = [
    { key: 'name', label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price' },
    { key: 'stock', label: 'Stock' },
    { key: 'status', label: 'Status' },
  ];

  const title = products.isLoading
    ? 'Loading…'
    : debouncedSearch
      ? `${total} matching`
      : `${total} products in catalog`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Products</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your catalog and upload product images to the CDN.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={priceSync.isPending || products.isLoading}
            onClick={() => {
              setSyncMessage(null);
              priceSync.mutate();
            }}
          >
            <RefreshCw className={`size-4 ${priceSync.isPending ? 'animate-spin' : ''}`} />
            {priceSync.isPending ? 'Syncing prices…' : 'Sync single-card prices'}
          </Button>
          <Button asChild>
            <Link to="/admin/new">
              <ImagePlus className="size-4" />
              Add product
            </Link>
          </Button>
        </div>
      </div>

      {syncMessage ? (
        <p className="text-muted-foreground text-sm" role="status">
          {syncMessage}
        </p>
      ) : null}

      <CatalogStatsRow stats={catalogStats} isLoading={products.isLoading && !products.data} />

      <Card>
        <CardHeader className="flex flex-col gap-3 space-y-0 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <div className="relative w-full sm:max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, Pokémon, set…"
              aria-label="Search products"
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {products.isLoading && !products.data ? (
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : products.isError ? (
            <p className="text-destructive p-4 text-sm">Could not load products.</p>
          ) : rows.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-border text-muted-foreground border-b">
                      {columns.map((col) => (
                        <th key={col.key} className="px-4 py-3 font-medium">
                          <button
                            type="button"
                            className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                            onClick={() => toggleSort(col.key)}
                            aria-label={`Sort by ${col.label}`}
                          >
                            {col.label}
                            <SortIcon active={sortKey === col.key} dir={sortDir} />
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((product) => {
                      const imageUrl = resolveAssetUrl(primaryProductImage(product), cdn);
                      return (
                        <tr
                          key={product.id}
                          className="border-border/60 hover:bg-muted/40 border-b last:border-0"
                        >
                          <td className="px-4 py-3">
                            <Link
                              to={`/admin/products/${product.id}`}
                              className="flex items-center gap-3"
                            >
                              <div
                                className="bg-muted size-10 shrink-0 overflow-hidden rounded-md"
                                style={
                                  !imageUrl
                                    ? {
                                        background: `linear-gradient(135deg, ${product.accent}, #0b0712)`,
                                      }
                                    : undefined
                                }
                              >
                                {imageUrl ? (
                                  <img
                                    src={imageUrl}
                                    alt=""
                                    className="size-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <Package className="text-muted-foreground m-2 size-6 opacity-60" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium">{product.name}</p>
                                <p className="text-muted-foreground truncate font-mono text-xs">
                                  {product.id}
                                </p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              to={`/admin/products/${product.id}`}
                              className="hover:text-foreground block"
                            >
                              {categoryLabel(product.category)}
                            </Link>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            <Link
                              to={`/admin/products/${product.id}`}
                              className="hover:text-foreground block"
                            >
                              {formatPrice(product.price, product.currency)}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              to={`/admin/products/${product.id}`}
                              className="hover:text-foreground block"
                            >
                              {product.stock}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <Link to={`/admin/products/${product.id}`} className="block">
                              <div className="flex flex-wrap gap-1">
                                {product.featured && <Badge variant="default">Featured</Badge>}
                                {product.isNew && <Badge variant="success">New</Badge>}
                                {product.stock <= 0 && <Badge variant="destructive">Out</Badge>}
                              </div>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <nav
                aria-label="Product pages"
                className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3"
              >
                <p className="text-muted-foreground text-xs">
                  Showing {from}–{to} of {total}
                  {pageCount > 1 ? ` · Page ${shownPage + 1} of ${pageCount}` : ''}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page === 0 || products.isFetching}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!products.data?.hasMore || products.isFetching}
                    onClick={() => setPage((current) => current + 1)}
                  >
                    Next
                  </Button>
                </div>
              </nav>
            </>
          ) : (
            <p className="text-muted-foreground p-4 text-sm">
              {debouncedSearch
                ? 'No products match that search. Try another name before adding a new card.'
                : 'No products yet.'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
