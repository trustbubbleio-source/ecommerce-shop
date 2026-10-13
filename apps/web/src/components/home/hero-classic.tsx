import { Button } from '@akknerds/ui';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Pokeball } from '../common/pokeball';
import { PRELAUNCH } from '../../config/launch';
import { HeroPackRip } from './hero-pack-rip';
import { HeroSeriesShowcase } from './hero-series';

/**
 * Previous aurora/series home hero.
 * Kept so we can swap back from `HeroVideo` while testing the store video header.
 */
export function HeroClassic() {
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
          {/* Booster rip stays in the tree; the series rail is what visitors see. */}
          <div className="hidden" aria-hidden="true">
            <div className="relative aspect-square w-full max-w-[17rem] sm:max-w-xs lg:max-w-md">
              <div className="border-border from-foreground/10 shadow-glow absolute inset-0 rounded-3xl border bg-gradient-to-br via-transparent to-transparent" />
              <HeroPackRip className="absolute inset-0" />
            </div>
          </div>
          <HeroSeriesShowcase />
        </div>
      </div>
    </section>
  );
}
