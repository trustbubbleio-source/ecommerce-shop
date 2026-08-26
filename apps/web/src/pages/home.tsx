import { Button } from '@akknerds/ui';
import {
  primaryProductImage,
  resolveAssetUrl,
  type Product,
  type ProductCategory,
} from '@akknerds/shared';
import { ArrowRight, MapPin, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Pokeball } from '../components/common/pokeball';
import { NewsletterSubscribe } from '../components/common/newsletter-subscribe';
import { SectionHeader } from '../components/common/section';
import { HeroPackRip } from '../components/home/hero-pack-rip';
import { ProductGrid } from '../components/product/product-grid';
import { PRELAUNCH } from '../config/launch';
import { CATEGORY_TILES, SITE } from '../config/site';
import { useProducts } from '../hooks/use-products';

const VALUE_PROPS = [
  { icon: ShieldCheck, title: '100% Authentic', text: 'Factory-sealed, never resealed.' },
  { icon: Truck, title: 'Fast, tracked shipping', text: 'Free over €75. Ships in 24h.' },
  { icon: Sparkles, title: 'Graded singles', text: 'Hand-checked, Near Mint or better.' },
];

function Hero() {
  return (
    <section className="border-border relative overflow-hidden border-b">
      <div className="aurora pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div
        className="bg-grid-faint pointer-events-none absolute inset-0 opacity-20 [background-size:32px_32px]"
        aria-hidden="true"
      />
      <div className="container relative grid gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div className="flex flex-col items-start justify-center gap-6">
          <span className="border-border bg-secondary text-foreground inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
            <Pokeball className="size-4" /> {PRELAUNCH.homeEyebrow2}
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Just one more <span className="text-gradient">rip</span>.<br />
            You know the feeling.
          </h1>
          <p className="text-muted-foreground max-w-md text-lg">
            Booster boxes, Elite Trainer Boxes, packs and graded singles, curated by collectors, for
            collectors.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/shop">
                Buy all products <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/shop?category=booster-box">Browse booster boxes</Link>
            </Button>
          </div>
          <dl className="mt-2 flex gap-8">
            {[
              { k: '10k+', v: 'Orders shipped' },
              { k: '4.9★', v: 'Avg. rating' },
              { k: '24h', v: 'Dispatch time' },
            ].map((stat) => (
              <div key={stat.v}>
                <dt className="text-foreground text-2xl font-extrabold">{stat.k}</dt>
                <dd className="text-muted-foreground text-xs">{stat.v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="relative aspect-square w-full max-w-[17rem] sm:max-w-xs lg:max-w-md">
            <div className="border-border from-foreground/10 shadow-glow absolute inset-0 rounded-3xl border bg-gradient-to-br via-transparent to-transparent" />
            <HeroPackRip className="absolute inset-0" />
          </div>
        </div>
      </div>
    </section>
  );
}

function LaunchAnnouncement() {
  if (!PRELAUNCH.active) return null;

  const storeImage = resolveAssetUrl(PRELAUNCH.storeImage, import.meta.env.VITE_ASSET_CDN_URL);

  return (
    <section className="container py-12">
      <div className="border-border relative overflow-hidden rounded-2xl border">
        <div
          className="from-foreground/8 pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent"
          aria-hidden="true"
        />
        <div
          className="bg-grid-faint pointer-events-none absolute inset-0 opacity-10 [background-size:28px_28px]"
          aria-hidden="true"
        />

        <div className="relative grid lg:grid-cols-2">
          <div className="flex flex-col justify-center gap-4 px-6 py-10 sm:px-10 sm:py-14">
            <span className="border-border bg-secondary text-foreground inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              {PRELAUNCH.homeEyebrow}
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {PRELAUNCH.homeTitle}
            </h2>
            <p className="text-muted-foreground max-w-md text-base leading-relaxed sm:text-lg">
              {PRELAUNCH.homeBody}
            </p>
            <p className="text-foreground text-sm font-semibold tracking-wide">
              Online shop · Physical store · October 15, 2026
            </p>
            <p className="text-muted-foreground inline-flex items-start gap-2 text-sm">
              <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
              <span>{SITE.store.line}</span>
            </p>
          </div>

          {storeImage && (
            <div className="group relative min-h-[18rem] overflow-hidden sm:min-h-[22rem] lg:min-h-full">
              <img
                src={storeImage}
                alt={`${SITE.name} storefront in ${SITE.store.city}`}
                className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                loading="lazy"
              />
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-black/20 lg:to-black/40"
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                  Visit us
                </p>
                <p className="text-lg font-bold text-white drop-shadow-sm">
                  {SITE.store.city}, Sweden
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function pickCategoryImage(
  products: Product[] | undefined,
  category: ProductCategory,
): string | undefined {
  const cdn = import.meta.env.VITE_ASSET_CDN_URL;
  const match = products?.find((p) => p.category === category && primaryProductImage(p));
  return match ? resolveAssetUrl(primaryProductImage(match), cdn) : undefined;
}

function Categories() {
  const catalog = useProducts({ limit: 60 });

  return (
    <section className="container py-12">
      <SectionHeader title="Buy by category" subtitle="Find exactly what you're hunting for" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {CATEGORY_TILES.map((tile) => {
          const imageUrl = pickCategoryImage(catalog.data?.products, tile.category);

          return (
            <Link
              key={tile.category}
              to={`/shop?category=${tile.category}`}
              className="border-border bg-card hover:border-foreground/25 hover:shadow-glow group relative overflow-hidden rounded-xl border p-5 transition-all hover:-translate-y-1"
            >
              {imageUrl ? (
                <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                  <img
                    src={imageUrl}
                    alt=""
                    className="absolute -bottom-10 -right-14 w-[78%] max-w-none rotate-[12deg] object-contain opacity-55 sm:-bottom-8 sm:-right-12"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="from-card via-card/85 to-card/25 absolute inset-0 bg-gradient-to-br" />
                  <div className="absolute inset-0 bg-black/35 mix-blend-multiply" />
                </div>
              ) : null}

              <div className="relative z-10 flex h-full min-h-[7.5rem] flex-col">
                <h3 className="text-foreground font-bold">{tile.label}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{tile.blurb}</p>
                <span className="text-primary mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold">
                  Buy now{' '}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function ValueProps() {
  return (
    <section className="border-border bg-card/30 border-y">
      <div className="container grid gap-6 py-8 sm:grid-cols-3">
        {VALUE_PROPS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-center gap-3">
            <span className="bg-secondary text-foreground grid size-11 shrink-0 place-items-center rounded-lg">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-foreground font-semibold">{title}</p>
              <p className="text-muted-foreground text-sm">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomePage() {
  const featured = useProducts({ featured: true, limit: 8 });
  const fresh = useProducts({ isNew: true, sort: 'newest', limit: 4 });

  return (
    <>
      <Hero />
      <ValueProps />
      <LaunchAnnouncement />
      <Categories />

      <section className="container py-12">
        <SectionHeader
          title="Featured products"
          subtitle="Hand-picked drops our collectors love"
          action={{ label: 'View all', to: '/shop' }}
        />
        <ProductGrid
          products={featured.data?.products}
          isLoading={featured.isLoading}
          skeletonCount={8}
        />
      </section>

      <NewsletterSubscribe />

      <section className="container pb-16">
        <SectionHeader
          title="New arrivals"
          subtitle="Fresh on the shelves"
          action={{ label: 'See all new', to: '/shop?sort=newest' }}
        />
        <ProductGrid
          products={fresh.data?.products}
          isLoading={fresh.isLoading}
          skeletonCount={4}
        />
      </section>
    </>
  );
}
