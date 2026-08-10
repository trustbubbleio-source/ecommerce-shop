import { categoryLabel, formatPrice, primaryProductImage, resolveAssetUrl, type CatalogStats, type Product } from '@akknerds/shared';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@akknerds/ui';
import { ArrowDown, ArrowUp, ArrowUpDown, Boxes, ImagePlus, Package, RefreshCw, Wallet } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

type SortKey = 'name' | 'category' | 'price' | 'stock' | 'status';
type SortDir = 'asc' | 'desc';

const EMPTY_CATALOG_STATS: CatalogStats = {
  listings: 0,
  unitsInStock: 0,
  inventoryValueCents: 0,
};

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

function statusSortKey(product: Product): string {
  const parts: string[] = [];
  if (product.stock <= 0) parts.push('out');
  if (product.featured) parts.push('featured');
  if (product.isNew) parts.push('new');
  return parts.join(',') || 'active';
}

function compareProducts(a: Product, b: Product, key: SortKey, dir: SortDir): number {
  let cmp = 0;
  switch (key) {
    case 'name':
      cmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      break;
    case 'category':
      cmp = categoryLabel(a.category).localeCompare(categoryLabel(b.category), undefined, {
        sensitivity: 'base',
      });
      break;
    case 'price':
      cmp = a.price - b.price;
      break;
    case 'stock':
      cmp = a.stock - b.stock;
      break;
    case 'status':
      cmp = statusSortKey(a).localeCompare(statusSortKey(b), undefined, { sensitivity: 'base' });
      break;
  }
  return dir === 'asc' ? cmp : -cmp;
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
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const products = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: () => api.adminListProducts(),
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

  const sortedProducts = useMemo(() => {
    const list = products.data?.products ?? [];
    return [...list].sort((a, b) => compareProducts(a, b, sortKey, sortDir));
  }, [products.data?.products, sortKey, sortDir]);

  const catalogStats = products.data?.stats ?? EMPTY_CATALOG_STATS;

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDir('asc');
  };

  const cdn = import.meta.env.VITE_ASSET_CDN_URL;

  const columns: { key: SortKey; label: string; className?: string }[] = [
    { key: 'name', label: 'Product' },
    { key: 'category', label: 'Category' },
    { key: 'price', label: 'Price' },
    { key: 'stock', label: 'Stock' },
    { key: 'status', label: 'Status' },
  ];

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

      <CatalogStatsRow stats={catalogStats} isLoading={products.isLoading} />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            {products.isLoading
              ? 'Loading…'
              : `${products.data?.total ?? 0} products in catalog`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {products.isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : products.isError ? (
            <p className="text-destructive p-4 text-sm">Could not load products.</p>
          ) : products.data && products.data.products.length > 0 ? (
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
                  {sortedProducts.map((product) => {
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
          ) : (
            <p className="text-muted-foreground p-4 text-sm">No products yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
