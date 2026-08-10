import type { Product } from '@akknerds/shared';
import { Skeleton } from '@akknerds/ui';
import { PackageOpen } from 'lucide-react';
import { EmptyState } from '../common/empty-state';
import { ProductCard } from './product-card';

function ProductCardSkeleton() {
  return (
    <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-0">
      <Skeleton className="aspect-[5/7] w-full rounded-b-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}

interface ProductGridProps {
  products?: Product[];
  isLoading?: boolean;
  skeletonCount?: number;
}

export function ProductGrid({ products, isLoading, skeletonCount = 8 }: ProductGridProps) {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        data-testid="product-grid-loading"
      >
        {Array.from({ length: skeletonCount }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <EmptyState
        icon={<PackageOpen />}
        title="No products found"
        description="Try adjusting your filters or search to find what you're looking for."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
