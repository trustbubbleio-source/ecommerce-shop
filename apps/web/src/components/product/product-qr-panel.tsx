import { ProductQrCode, buildProductUrl, type ProductQrVariant } from '@akknerds/qr';
import { Button, Card, CardContent, CardHeader, CardTitle, cn } from '@akknerds/ui';
import { ExternalLink, QrCode } from 'lucide-react';
import { SITE } from '../../config/site';

export interface ProductQrPanelProps {
  slug: string;
  productName: string;
  variant?: ProductQrVariant;
  className?: string;
  /** Override storefront origin (defaults to production SITE.url). */
  baseUrl?: string;
}

const qrButtonClasses =
  '[&_button]:border-border [&_button]:inline-flex [&_button]:items-center [&_button]:justify-center [&_button]:rounded-lg [&_button]:border [&_button]:px-3 [&_button]:py-1.5 [&_button]:text-sm [&_button]:font-medium [&_button]:transition-colors [&_button]:disabled:opacity-50';

/**
 * Branded QR panel for admin edit + public PDP.
 * Always encodes the live production product URL so printed codes stay valid.
 */
export function ProductQrPanel({
  slug,
  productName,
  variant = 'admin',
  className,
  baseUrl = SITE.url,
}: ProductQrPanelProps) {
  const url = buildProductUrl(baseUrl, slug);
  const isAdmin = variant === 'admin';

  if (isAdmin) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="flex flex-row items-center gap-2 space-y-0">
          <QrCode className="text-muted-foreground size-4" aria-hidden />
          <CardTitle className="text-base">QR code</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductQrCode
            baseUrl={baseUrl}
            slug={slug}
            productName={productName}
            variant="admin"
            size={200}
            className={cn(
              qrButtonClasses,
              'product-qr-admin [&_button]:bg-secondary [&_button]:text-secondary-foreground [&_button]:hover:bg-secondary/80',
            )}
          />
          <div className="mt-4">
            <Button type="button" variant="outline" size="sm" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" />
                Open live page
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <section
      className={cn(
        'border-border from-card via-card to-secondary/40 relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 sm:p-6',
        className,
      )}
      aria-label="Product QR code"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full opacity-[0.07]"
        style={{
          background: 'radial-gradient(circle, hsl(var(--foreground)) 0%, transparent 70%)',
        }}
        aria-hidden
      />
      <ProductQrCode
        baseUrl={baseUrl}
        slug={slug}
        productName={productName}
        variant="storefront"
        size={120}
        className={cn(
          qrButtonClasses,
          'product-qr-storefront relative [&_button]:bg-background/80 [&_button]:text-foreground [&_button]:hover:bg-background [&_button]:backdrop-blur',
        )}
      />
    </section>
  );
}
