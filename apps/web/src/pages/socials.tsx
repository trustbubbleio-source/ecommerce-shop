import { Button, cn } from '@akknerds/ui';
import { ArrowRight, ExternalLink, Gift, Megaphone, Radio, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/page-header';
import { SocialPlatformIcon } from '../components/socials/social-platform-icon';
import { CONTESTS, SOCIAL_CHANNELS, contestProgressPercent, type Contest } from '../config/socials';
import { SITE } from '../config/site';
import './socials-page.css';

const SHOP_TO_SOCIAL = [
  {
    icon: Radio,
    title: 'Drops go live socially first',
    text: 'Restocks, chase singles and launch-day heat hit Instagram & TikTok so collectors know where to look.',
  },
  {
    icon: Gift,
    title: 'Contests & community rewards',
    text: 'Followers unlock challenges, shoutouts and thank-you moments tied to the shop, not random spam.',
  },
  {
    icon: Store,
    title: 'Online shop + Båstad store',
    text: 'Same brand everywhere: browse onemorerip.cards now,  the physical store in Båstad opens October 15, 2026.',
  },
] as const;

function formatFollowers(n: number): string {
  return n.toLocaleString('en-US');
}

function ContestCard({ contest }: { contest: Contest }) {
  const isActive = contest.status === 'active';

  return (
    <article
      className={cn(
        'border-border bg-card relative overflow-hidden rounded-2xl border',
        isActive && 'socials-contest-glow',
      )}
    >
      <div className="from-foreground/[0.05] pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent" />
      <div className="relative flex flex-col gap-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]',
              isActive
                ? 'border-foreground/30 bg-foreground text-background'
                : 'border-border bg-secondary text-muted-foreground',
            )}
          >
            {contest.badge}
          </span>
          {isActive ? (
            <span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs font-medium">
              <span className="socials-pulse bg-foreground size-1.5 rounded-full" />
              In progress
            </span>
          ) : null}
        </div>

        <div className="max-w-2xl">
          <h3 className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
            {contest.title}
          </h3>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
            {contest.summary}
          </p>
        </div>

        {contest.goals ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {contest.goals.map((goal) => {
              const pct = contestProgressPercent(goal.current, goal.goal);
              const channel = SOCIAL_CHANNELS.find((c) => c.id === goal.platform);
              return (
                <div
                  key={goal.platform}
                  className="border-border bg-background/60 flex flex-col gap-3 rounded-xl border p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-secondary text-foreground grid size-9 place-items-center rounded-lg">
                        <SocialPlatformIcon platform={goal.platform} className="size-4" />
                      </span>
                      <div>
                        <p className="text-foreground text-sm font-semibold">{goal.label}</p>
                        <p className="text-muted-foreground text-xs">{channel?.handle}</p>
                      </div>
                    </div>
                    <p className="text-foreground text-sm font-bold tabular-nums">{pct}%</p>
                  </div>
                  <div
                    className="bg-secondary h-2 overflow-hidden rounded-full"
                    role="progressbar"
                    aria-valuenow={goal.current}
                    aria-valuemin={0}
                    aria-valuemax={goal.goal}
                    aria-label={`${goal.label} followers`}
                  >
                    <div
                      className="socials-progress-fill bg-foreground h-full rounded-full"
                      style={{ width: `${Math.max(pct, goal.current > 0 ? pct : 2)}%` }}
                    />
                  </div>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {formatFollowers(goal.current)} / {formatFollowers(goal.goal)} followers
                  </p>
                  {channel ? (
                    <Button asChild size="sm" variant="outline" className="self-start">
                      <a href={channel.href} target="_blank" rel="noreferrer">
                        Follow {goal.label} <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="text-foreground mb-2 text-sm font-semibold uppercase tracking-wider">
              The story
            </h4>
            <div className="flex flex-col gap-2">
              {contest.body.map((paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="text-muted-foreground text-sm leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </div>
            <p className="text-foreground mt-3 text-sm font-medium">{contest.reward}</p>
          </div>
          <div>
            <h4 className="text-foreground mb-2 text-sm font-semibold uppercase tracking-wider">
              How to join
            </h4>
            <ol className="flex flex-col gap-2">
              {contest.howToJoin.map((step, index) => (
                <li key={step} className="text-muted-foreground flex gap-3 text-sm leading-relaxed">
                  <span className="text-foreground font-bold tabular-nums">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </article>
  );
}

export function SocialsPage() {
  const activeContests = CONTESTS.filter((c) => c.status === 'active');
  const otherContests = CONTESTS.filter((c) => c.status !== 'active');

  return (
    <div className="container max-w-5xl py-8">
      <section className="border-border relative mb-10 overflow-hidden rounded-2xl border">
        <div className="aurora pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <div
          className="bg-grid-faint pointer-events-none absolute inset-0 opacity-15 [background-size:28px_28px]"
          aria-hidden
        />
        <div className="relative px-6 py-10 sm:px-10 sm:py-14">
          <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-[0.2em]">
            Community hub
          </p>
          <h1 className="text-foreground max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            Socials
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-base leading-relaxed sm:text-lg">
            Find One More Rip where collectors hang out, contests, drops and the road to 5K on
            Instagram & TikTok.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#contests">
                See the 5K Challenge <ArrowRight />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#channels">Follow us</a>
            </Button>
          </div>
        </div>
      </section>

      <section id="channels" className="mb-14 scroll-mt-24">
        <PageHeader
          title="Where to find us"
          description="Same shop energy across every channel. Tap through and say hey."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_CHANNELS.map((channel, index) => (
            <a
              key={channel.id}
              href={channel.href}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'border-border bg-card hover:border-foreground/25 group relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-5 transition-colors',
                'socials-channel-enter',
              )}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="bg-secondary text-foreground grid size-11 place-items-center rounded-xl">
                  <SocialPlatformIcon platform={channel.id} />
                </span>
                <ExternalLink className="text-muted-foreground size-4 opacity-60 transition-opacity group-hover:opacity-100" />
              </div>
              <div>
                <h3 className="text-foreground font-bold">{channel.name}</h3>
                <p className="text-muted-foreground mt-0.5 text-sm">{channel.handle}</p>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {channel.blurb}
                </p>
              </div>
              <span className="text-foreground mt-auto inline-flex items-center gap-1 text-sm font-semibold">
                {channel.cta}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>
      </section>

      <section id="contests" className="mb-14 scroll-mt-24">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Contests</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Live challenges and community goals - updated as we grow.
            </p>
          </div>
          <Megaphone className="text-muted-foreground hidden size-6 sm:block" aria-hidden />
        </div>

        <div className="flex flex-col gap-6">
          {activeContests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
          {otherContests.map((contest) => (
            <ContestCard key={contest.id} contest={contest} />
          ))}
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-foreground mb-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Shop × socials
        </h2>
        <p className="text-muted-foreground mb-6 max-w-2xl text-sm sm:text-base">
          The webshop and the feed are one brand. Follow for signal, shop when the chase hits.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {SHOP_TO_SOCIAL.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="border-border bg-card/50 flex flex-col gap-3 rounded-xl border p-5"
            >
              <span className="bg-secondary text-foreground grid size-10 place-items-center rounded-lg">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-foreground font-bold">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <aside className="border-border bg-card mt-10 rounded-2xl border p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-foreground text-xl font-bold tracking-tight">Got a collab idea?</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Creators, sponsors and wholesalers , we&apos;d love to hear from you. Our physical
              store in Båstad opens October 15, 2026; until then, reach us online.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/partners">
                Looking for partners <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/contact">Contact</Link>
            </Button>
          </div>
        </div>
        <p className="text-muted-foreground mt-4 text-xs">
          Handles: {SITE.socialHandles.instagram} · {SITE.socialHandles.tiktok}
        </p>
      </aside>
    </div>
  );
}
