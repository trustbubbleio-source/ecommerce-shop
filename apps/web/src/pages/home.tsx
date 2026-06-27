import { Button } from '@akknerds/ui';
import { ArrowRight, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Pokeball } from '../components/common/pokeball';
import { SectionHeader } from '../components/common/section';
import { ProductGrid } from '../components/product/product-grid';
import { CATEGORY_TILES } from '../config/site';
import { useProducts } from '../hooks/use-products';

const VALUE_PROPS = [
  { icon: ShieldCheck, title: '100% Authentic', text: 'Factory-sealed, never resealed.' },
  { icon: Truck, title: 'Fast, tracked shipping', text: 'Free over $75. Ships in 24h.' },
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
          <span className="border-primary/30 bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold">
            <Pokeball className="size-4" /> New: Temporal Forces in stock
          </span>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Catch the <span className="text-gradient">chase</span>.<br />
            Sealed Pokémon TCG, delivered.
          </h1>
          <p className="text-muted-foreground max-w-md text-lg">
            Booster boxes, Elite Trainer Boxes, packs and graded singles — curated by collectors,
            for collectors.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/shop">
                Shop all products <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/shop?category=booster-box">Browse booster boxes</Link>
            </Button>
          </div>
          <dl className="mt-2 flex gap-8">
            {[
              { k: '20k+', v: 'Orders shipped' },
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

        <div className="relative hidden items-center justify-center lg:flex">
          <div className="relative aspect-square w-full max-w-md">
            <div className="border-border from-primary/30 via-accent/10 shadow-glow absolute inset-0 rounded-3xl border bg-gradient-to-br to-transparent" />
            <Pokeball className="animate-float text-primary/40 absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Categories() {
  return (
    <section className="container py-12">
      <SectionHeader title="Shop by category" subtitle="Find exactly what you're hunting for" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {CATEGORY_TILES.map((tile) => (
          <Link
            key={tile.category}
            to={`/shop?category=${tile.category}`}
            className="border-border bg-card hover:border-primary/50 hover:shadow-glow group relative overflow-hidden rounded-xl border p-5 transition-all hover:-translate-y-1"
          >
            <Pokeball className="text-primary/10 absolute -right-4 -top-4 size-20 transition-transform group-hover:scale-125" />
            <h3 className="text-foreground font-bold">{tile.label}</h3>
            <p className="text-muted-foreground mt-1 text-sm">{tile.blurb}</p>
            <span className="text-primary mt-4 inline-flex items-center gap-1 text-sm font-semibold">
              Shop now{' '}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
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
            <span className="bg-primary/15 text-primary grid size-11 shrink-0 place-items-center rounded-lg">
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
