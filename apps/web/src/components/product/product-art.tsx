import { type Product, categoryLabel } from '@akknerds/shared';
import { cn } from '@akknerds/ui';
import { Pokeball } from '../common/pokeball';

type ArtProduct = Pick<Product, 'accent' | 'set' | 'series' | 'category' | 'name' | 'image'>;

/**
 * Branded product artwork. Renders a real image when present, otherwise a
 * consistent on-brand gradient tile derived from the product's accent colour.
 */
export function ProductArt({ product, className }: { product: ArtProduct; className?: string }) {
  if (product.image) {
    return (
      <img
        src={product.image}
        alt={product.name}
        loading="lazy"
        className={cn('h-full w-full object-cover', className)}
      />
    );
  }

  return (
    <div
      className={cn('relative h-full w-full overflow-hidden', className)}
      style={{ background: `linear-gradient(150deg, ${product.accent} -10%, #0b0712 78%)` }}
      role="img"
      aria-label={product.name}
    >
      <Pokeball className="absolute -right-8 -top-8 size-44 text-white/10" />
      <Pokeball className="absolute -bottom-12 -left-10 size-40 text-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      <span className="absolute left-3 top-3 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/90 backdrop-blur-sm">
        {categoryLabel(product.category)}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
          {product.series}
        </p>
        <p className="text-xl font-extrabold leading-tight text-white drop-shadow">{product.set}</p>
      </div>
    </div>
  );
}
