import { categoryLabel, titleCase } from '@akknerds/shared';
import { Badge, Button, QuantityStepper, Rating, Separator, Skeleton } from '@akknerds/ui';
import { ArrowLeft, PackageX, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '../components/common/empty-state';
import { SectionHeader } from '../components/common/section';
import { AddToCartButton } from '../components/product/add-to-cart-button';
import { PriceTag } from '../components/product/price-tag';
import { ProductArt } from '../components/product/product-art';
import { ProductGrid } from '../components/product/product-grid';
import { useProduct, useProducts } from '../hooks/use-products';

function DetailSkeleton() {
  return (
    <div className="container grid gap-8 py-8 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full rounded-xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useProduct(slug);
  const product = data?.product;
  const related = useProducts({ category: product?.category, limit: 5 });
  const [quantity, setQuantity] = useState(1);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !product) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={<PackageX />}
          title="Product not found"
          description="This product may have sold out or moved."
          action={
            <Button asChild>
              <Link to="/shop">Back to shop</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const soldOut = product.stock <= 0;
  const relatedProducts = (related.data?.products ?? [])
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="container py-8">
      <Link
        to="/shop"
        className="text-muted-foreground hover:text-foreground mb-6 inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" /> Back to shop
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="border-border overflow-hidden rounded-2xl border">
          <div className="aspect-square">
            <ProductArt product={product} />
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{categoryLabel(product.category)}</Badge>
              {product.isNew && <Badge>New</Badge>}
              {product.rarity && (
                <Badge variant="outline">{titleCase(product.rarity.replace(/-/g, ' '))}</Badge>
              )}
              {product.condition && (
                <Badge variant="muted">{titleCase(product.condition.replace(/-/g, ' '))}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{product.name}</h1>
            <p className="text-muted-foreground text-sm">
              {product.series} · {product.set}
            </p>
            <Rating value={product.rating} reviewCount={product.reviewCount} size={16} />
          </div>

          <PriceTag product={product} size="lg" />

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="flex items-center gap-2 text-sm">
            <span
              className={soldOut ? 'text-destructive font-semibold' : 'text-success font-semibold'}
            >
              {soldOut ? 'Out of stock' : 'In stock'}
            </span>
            {!soldOut && product.stock <= 5 && (
              <span className="text-muted-foreground">— only {product.stock} left</span>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {!soldOut && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Qty</span>
                <QuantityStepper
                  value={quantity}
                  min={1}
                  max={Math.max(1, product.stock)}
                  onChange={setQuantity}
                />
              </div>
            )}
            <AddToCartButton
              product={product}
              quantity={quantity}
              size="lg"
              className="flex-1"
              label="Add to cart"
            />
          </div>

          <ul className="mt-2 grid gap-3 text-sm sm:grid-cols-2">
            <li className="text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="text-primary size-4" /> Authentic & sealed
            </li>
            <li className="text-muted-foreground flex items-center gap-2">
              <Truck className="text-primary size-4" /> Free shipping over $75
            </li>
            <li className="text-muted-foreground flex items-center gap-2">
              <RotateCcw className="text-primary size-4" /> 30-day returns
            </li>
          </ul>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <SectionHeader title="You might also like" />
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
