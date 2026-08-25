import { Button, Skeleton } from '@akknerds/ui';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/common/empty-state';
import { ProductGrid } from '../../components/product/product-grid';
import { useFavoriteProducts } from '../../hooks/use-favorites';

export function AccountFavoritesPage() {
  const favorites = useFavoriteProducts();

  if (favorites.isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Skeleton className="aspect-[5/7] w-full rounded-xl" />
        <Skeleton className="aspect-[5/7] w-full rounded-xl" />
        <Skeleton className="aspect-[5/7] w-full rounded-xl" />
      </div>
    );
  }

  const products = favorites.data?.products ?? [];

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Heart />}
        title="No favorites yet"
        description="Tap the heart on any product to save it here for later."
        action={
          <Button asChild>
            <Link to="/shop">Browse the shop</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted-foreground text-sm">
        {products.length} saved {products.length === 1 ? 'product' : 'products'}
      </p>
      <ProductGrid products={products} />
    </div>
  );
}
