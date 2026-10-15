import { Button } from '@akknerds/ui';
import { resolveAssetUrl } from '@akknerds/shared';
import { ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Pokeball } from '../common/pokeball';
import { PRELAUNCH } from '../../config/launch';

/** Slightly under 1 so the store loop feels calmer without looking “slow-mo”. */
const HERO_PLAYBACK_RATE = 0.9;

/** Full-bleed looping store video hero for the home page. */
export function HeroVideo() {
  const videoUrl = resolveAssetUrl(PRELAUNCH.storeVideo, import.meta.env.VITE_ASSET_CDN_URL);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.playbackRate = HERO_PLAYBACK_RATE;
  }, [videoUrl]);

  return (
    <section className="border-border relative isolate overflow-hidden border-b">
      {videoUrl ? (
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          onLoadedMetadata={(e) => {
            e.currentTarget.playbackRate = HERO_PLAYBACK_RATE;
          }}
        >
          <source src={videoUrl} type="video/mp4" />
        </video>
      ) : (
        <div className="bg-secondary absolute inset-0" aria-hidden="true" />
      )}

      {/* Soft dark overlay so copy stays readable over the store footage */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/70"
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute inset-0 bg-black/25" aria-hidden="true" />

      <div className="container relative flex min-h-[min(78vh,42rem)] flex-col items-start justify-center gap-6 py-16 lg:min-h-[min(72vh,38rem)] lg:py-24">
        <span className="border-white/20 bg-black/35 text-white inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm">
          <Pokeball className="size-4" /> {PRELAUNCH.homeEyebrow2}
        </span>
        <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
          Just one more <span className="text-gradient">rip</span>.
          <br />
          You know the feeling.
        </h1>
        <p className="max-w-md text-lg text-white/80">
          Booster boxes, Elite Trainer Boxes, packs and graded singles, curated by collectors, for
          collectors.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/shop">
              All products <ArrowRight />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white/30 bg-black/30 text-white hover:bg-black/45 hover:text-white"
          >
            <Link to="/shop?category=booster-box">Browse booster boxes</Link>
          </Button>
        </div>
        <dl className="mt-2 flex gap-8">
          {[
            { k: 'Compete', v: 'Tournaments' },
            { k: 'Play', v: 'Game nights' },
            { k: 'Trade', v: 'Trade nights' },
          ].map((stat) => (
            <div key={stat.v}>
              <dt className="text-2xl font-extrabold text-white">{stat.k}</dt>
              <dd className="text-xs text-white/65">{stat.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
