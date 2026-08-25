import { categoryLabel, isCardStyleCategory, languageLabel, productImageUrls, titleCase } from '@akknerds/shared';
import { Badge, Button, ImageLightbox, QuantityStepper, Rating, Separator, Skeleton, cn } from '@akknerds/ui';
import { ArrowLeft, Expand, PackageX, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '../components/common/empty-state';
import { SectionHeader } from '../components/common/section';
import { AddToCartButton } from '../components/product/add-to-cart-button';
import { FavoriteButton } from '../components/product/favorite-button';
import { LaunchBadge } from '../components/product/launch-badge';
import { PriceTag } from '../components/product/price-tag';
import { ProductArt } from '../components/product/product-art';
import { RarityIcon } from '../components/product/rarity-icon';
import { ProductGrid } from '../components/product/product-grid';
import { ProductPriceHistory } from '../components/product/product-price-history';
import { ProductReviewsSection } from '../components/product/product-reviews';
import { PRELAUNCH, isPrelaunchActive } from '../config/launch';
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
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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
  const prelaunch = isPrelaunchActive();
  const gallery = productImageUrls(product, import.meta.env.VITE_ASSET_CDN_URL);
  const isCardStyle = isCardStyleCategory(product.category);
  const mainImageAspect = isCardStyle ? 'aspect-[5/7]' : 'aspect-square';
  const mainImageFit = isCardStyle ? 'object-contain p-4' : 'object-cover';
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
        <div
          className={cn(
            'flex flex-col gap-3',
            isCardStyle && 'mx-auto w-full max-w-[20rem]',
          )}
        >
          <div className="border-border relative overflow-hidden rounded-2xl border">
            <LaunchBadge />
            <div className={cn('bg-muted/20', mainImageAspect)}>
              {gallery.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  aria-label="Expand image"
                  className="group focus-visible:ring-ring relative block size-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2"
                >
                  <img
                    src={gallery[activeImage]}
                    alt={product.name}
                    className={cn('size-full', mainImageFit)}
                  />
                  <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/40 p-2 text-white/90 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    <Expand className="size-4" />
                  </span>
                </button>
              ) : (
                <ProductArt product={product} />
              )}
            </div>
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {gallery.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  className={cn(
                    'border-border bg-muted/20 overflow-hidden rounded-lg border',
                    isCardStyle ? 'aspect-[5/7]' : 'aspect-square',
                    index === activeImage && 'ring-primary ring-2',
                  )}
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show image ${index + 1}`}
                >
                  <img
                    src={url}
                    alt=""
                    className={cn('size-full', isCardStyle ? 'object-contain p-1' : 'object-cover')}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}

          {gallery.length > 0 && (
            <ImageLightbox
              images={gallery}
              open={lightboxOpen}
              onOpenChange={setLightboxOpen}
              index={activeImage}
              onIndexChange={setActiveImage}
              alt={product.name}
            />
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{categoryLabel(product.category)}</Badge>
              <Badge variant="muted">{languageLabel(product.language)}</Badge>
              {product.isNew && <Badge>New</Badge>}
              {product.rarity && (
                <Badge variant="outline" className="gap-1.5">
                  <RarityIcon rarity={product.rarity} />
                  {titleCase(product.rarity.replace(/-/g, ' '))}
                </Badge>
              )}
              {product.condition && (
                <Badge variant="muted">{titleCase(product.condition.replace(/-/g, ' '))}</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{product.name}</h1>
              <FavoriteButton
                productId={product.id}
                productName={product.name}
                size="md"
                className="shrink-0"
              />
            </div>
            <p className="text-muted-foreground text-sm">
              {product.series} · {product.set}
              {product.artist ? ` · Illus. ${product.artist}` : ''}
            </p>
            <Rating value={product.rating} reviewCount={product.reviewCount} size={16} />
          </div>

          <PriceTag product={product} size="lg" />

          <p className="text-muted-foreground leading-relaxed">{product.description}</p>

          <div className="flex items-center gap-2 text-sm">
            {prelaunch ? (
              <span className="font-semibold text-amber-400">{PRELAUNCH.description}</span>
            ) : (
              <>
                <span
                  className={
                    soldOut ? 'text-destructive font-semibold' : 'text-success font-semibold'
                  }
                >
                  {soldOut ? 'Out of stock' : 'In stock'}
                </span>
                {!soldOut && product.stock <= 5 && (
                  <span className="text-muted-foreground">— only {product.stock} left</span>
                )}
              </>
            )}
          </div>

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {!soldOut && !prelaunch && (
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
              <ShieldCheck className="text-foreground size-4" /> Authentic & sealed
            </li>
            <li className="text-muted-foreground flex items-center gap-2">
              <Truck className="text-foreground size-4" /> Free shipping over $75
            </li>
            <li className="text-muted-foreground flex items-center gap-2">
              <RotateCcw className="text-foreground size-4" /> 14-day returns
            </li>
          </ul>
        </div>
      </div>

      <ProductPriceHistory productId={product.id} currentPriceCents={product.price} />

      <ProductReviewsSection productSlug={product.slug} />

      {relatedProducts.length > 0 && (
        <section className="mt-16">
          <SectionHeader title="You might also like" />
          <ProductGrid products={relatedProducts} />
        </section>
      )}
    </div>
  );
}
