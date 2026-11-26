import {
  categoryLabel,
  isCardStyleCategory,
  languageLabel,
  productImageUrls,
} from '@akknerds/shared';
import { Button, Skeleton, cn } from '@akknerds/ui';
import { ArrowLeft, PackageX } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PriceTag } from '../../components/product/price-tag';
import { ProductArt } from '../../components/product/product-art';
import { LanguageFlag } from '../../components/product/language-flag';
import { useProduct } from '../../hooks/use-products';

function DetailSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-8 py-8">
      <Skeleton className="h-14 w-40 rounded-2xl" />
      <Skeleton className="mx-auto aspect-[5/7] w-full max-w-md rounded-3xl" />
      <Skeleton className="mx-auto h-10 w-3/4" />
      <Skeleton className="mx-auto h-12 w-1/3" />
    </div>
  );
}

export function KioskProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = useProduct(slug);
  const product = data?.product;
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !product) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-8 text-center">
        <PackageX className="text-muted-foreground size-14" aria-hidden />
        <h1 className="text-3xl font-bold">Product not found</h1>
        <p className="text-muted-foreground text-xl">It may have sold out or moved.</p>
        <Button asChild size="lg" className="h-16 rounded-2xl px-8 text-xl">
          <Link to="/kiosk">Back to catalogue</Link>
        </Button>
      </div>
    );
  }

  const soldOut = product.stock <= 0;
  const gallery = productImageUrls(product, import.meta.env.VITE_ASSET_CDN_URL);
  const isCardStyle = isCardStyleCategory(product.category);
  const mainAspect = isCardStyle ? 'aspect-[5/7]' : 'aspect-square';
  const mainFit = isCardStyle ? 'object-contain p-6' : 'object-cover';

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 px-6 pt-6">
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-14 rounded-2xl border-white/15 bg-white/5 px-5 text-lg"
        >
          <Link to="/kiosk">
            <ArrowLeft className="mr-2 size-5" />
            Back
          </Link>
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-8 pb-12 pt-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-6">
          <div
            className={cn(
              'border-border/60 bg-muted/20 relative overflow-hidden rounded-3xl border',
              mainAspect,
            )}
          >
            {gallery.length > 0 ? (
              <img
                src={gallery[activeImage]}
                alt={product.name}
                className={cn('size-full', mainFit)}
              />
            ) : (
              <ProductArt product={product} />
            )}
            {soldOut && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="rounded-full bg-destructive px-5 py-2 text-base font-bold uppercase tracking-wide text-white">
                  Sold out
                </span>
              </div>
            )}
          </div>

          {gallery.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {gallery.map((url, index) => (
                <button
                  key={url}
                  type="button"
                  className={cn(
                    'border-border/60 bg-muted/20 overflow-hidden rounded-xl border',
                    isCardStyle ? 'aspect-[5/7]' : 'aspect-square',
                    index === activeImage && 'ring-primary ring-2',
                  )}
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show image ${index + 1}`}
                >
                  <img
                    src={url}
                    alt=""
                    className={cn(
                      'size-full',
                      isCardStyle ? 'object-contain p-1' : 'object-cover',
                    )}
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex flex-col gap-4 text-center">
            <div className="flex items-center justify-center gap-3">
              <LanguageFlag language={product.language} />
              <span className="text-muted-foreground text-base font-semibold uppercase tracking-wide">
                {categoryLabel(product.category)}
              </span>
            </div>

            <p className="text-muted-foreground text-lg font-medium">
              {product.set}
              {product.series ? ` · ${product.series}` : ''}
            </p>

            <h1 className="text-4xl font-black leading-tight tracking-tight">{product.name}</h1>

            <div className="flex justify-center">
              <PriceTag product={product} size="lg" className="[&_span]:text-4xl" />
            </div>

            <p
              className={cn(
                'text-xl font-semibold',
                soldOut ? 'text-destructive' : 'text-emerald-400',
              )}
            >
              {soldOut
                ? 'Out of stock'
                : product.stock === 1
                  ? '1 left in store'
                  : `${product.stock} in stock`}
            </p>

            <p className="text-muted-foreground text-base">
              {languageLabel(product.language)} print
            </p>

            {product.description ? (
              <p className="text-muted-foreground mt-2 text-left text-lg leading-relaxed">
                {product.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
