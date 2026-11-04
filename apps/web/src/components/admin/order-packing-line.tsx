import {
  categoryLabel,
  conditionLabel,
  formatPrice,
  languageLabel,
  rarityLabel,
  type AdminOrderLine,
} from '@akknerds/shared';
import { Link } from 'react-router-dom';
import { ProductArt } from '../product/product-art';

export function OrderPackingLine({
  line,
  currency,
}: {
  line: AdminOrderLine;
  currency: string;
}) {
  const product = line.product;
  const meta: string[] = [];
  if (product) {
    meta.push(categoryLabel(product.category));
    meta.push(product.set);
    meta.push(languageLabel(product.language));
    if (product.cardNumber) meta.push(`#${product.cardNumber}`);
    if (product.condition) meta.push(conditionLabel(product.condition));
    if (product.rarity) meta.push(rarityLabel(product.rarity));
  }

  return (
    <div className="border-border flex gap-3 border-b py-3 last:border-b-0 last:pb-0 first:pt-0">
      <div className="bg-muted/30 relative size-20 shrink-0 overflow-hidden rounded-lg sm:size-24">
        {product ? (
          <ProductArt
            product={{
              name: line.name,
              accent: product.accent,
              set: product.set,
              series: product.series,
              category: product.category,
              images: product.images,
              image: product.image,
            }}
            variant="card"
            className="size-full"
          />
        ) : (
          <div className="text-muted-foreground grid size-full place-items-center px-2 text-center text-[10px] font-medium">
            No image
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-foreground font-semibold leading-snug">{line.name}</p>
            {meta.length > 0 ? (
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">{meta.join(' · ')}</p>
            ) : (
              <p className="text-muted-foreground mt-0.5 text-xs">
                Catalogue details unavailable (product removed).
              </p>
            )}
            {product ? (
              <p className="text-muted-foreground mt-1 text-[11px]">
                {product.series}
                {' · '}
                <Link
                  to={`/admin/products/${line.productId}`}
                  className="text-primary font-medium hover:underline"
                >
                  Edit product
                </Link>
                {' · '}
                <Link
                  to={`/product/${product.slug}?storefront=1`}
                  className="text-primary font-medium hover:underline"
                >
                  View listing
                </Link>
              </p>
            ) : (
              <p className="text-muted-foreground mt-1 font-mono text-[11px]">{line.productId}</p>
            )}
          </div>
          <span className="shrink-0 text-sm font-semibold">
            {formatPrice(line.unitPrice * line.quantity, currency)}
          </span>
        </div>
        <p className="text-muted-foreground text-xs">
          Qty {line.quantity}
          {line.quantity > 1 ? ` · ${formatPrice(line.unitPrice, currency)} each` : null}
        </p>
      </div>
    </div>
  );
}
