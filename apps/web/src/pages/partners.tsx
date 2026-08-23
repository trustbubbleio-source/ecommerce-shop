import { Button } from '@akknerds/ui';
import { ArrowRight, Handshake, Megaphone, Package, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/page-header';
import { SITE } from '../config/site';

const WHAT_WE_SEEK = [
  {
    icon: Package,
    title: 'Wholesalers & distributors',
    text: 'Reliable sealed Pokémon TCG supply at wholesale — boxes, ETBs, packs, and accessories we can stock for our online shop and store in Båstad.',
  },
  {
    icon: Handshake,
    title: 'Sponsors',
    text: 'Brands and suppliers who want visibility with collectors. Product sponsorship, launch support, or ongoing inventory partnerships are all of interest.',
  },
  {
    icon: Megaphone,
    title: 'Creators & collabs',
    text: 'Content creators, rip channels, and community partners for co-drops, giveaways, store events, and shared campaigns.',
  },
  {
    icon: Sparkles,
    title: 'Local & brand activations',
    text: 'Pop-ups, in-store events, and co-branded moments that bring collectors together — online and at our physical location.',
  },
] as const;

const STEPS = [
  {
    step: '01',
    title: 'Reach out',
    text: `Wholesale → ${SITE.email.trade}. Sponsorships & collabs → ${SITE.email.partner}. Tell us who you are and what you offer.`,
  },
  {
    step: '02',
    title: 'We talk scope',
    text: 'We discuss fit, volumes or campaign ideas, timelines, and what a good partnership looks like for both sides.',
  },
  {
    step: '03',
    title: 'Build together',
    text: 'If it clicks, we align on terms and start — whether that is supply, sponsorship, or a public collaboration.',
  },
] as const;

export function PartnersPage() {
  const partnerMail = `mailto:${SITE.email.partner}?subject=${encodeURIComponent(
    'Sponsorship / collab — One More Rip',
  )}`;
  const tradeMail = `mailto:${SITE.email.trade}?subject=${encodeURIComponent(
    'Wholesale / trade enquiry — One More Rip',
  )}`;

  return (
    <div className="container max-w-5xl py-8">
      <PageHeader
        title="Looking for partners"
        description="One More Rip is open to wholesalers, sponsors, and collaborations. If you can help us grow authentic sealed Pokémon TCG in Sweden — let’s talk."
      />

      <section className="border-border bg-card mb-12 overflow-hidden rounded-2xl border">
        <div className="from-foreground/[0.04] relative bg-gradient-to-br via-transparent to-transparent px-6 py-10 sm:px-10 sm:py-12">
          <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-[0.18em]">
            Open for collabs
          </p>
          <h2 className="text-foreground max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">
            We’re building a collector shop — and we want the right partners beside us.
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
            We run an online catalogue and open our physical store in Båstad on October 15, 2026. Right
            now we&apos;re actively looking for wholesale supply, product sponsorship, and creative
            collaborations that make sense for the TCG community — not one-off spam, real long-term
            fits. Wholesale & trade: {SITE.email.trade}. Sponsorships & collabs: {SITE.email.partner}.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href={tradeMail}>
                Wholesale / trade <ArrowRight />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={partnerMail}>Sponsorship / collab</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Contact form</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-foreground mb-2 text-xl font-bold tracking-tight sm:text-2xl">
          What we’re looking for
        </h2>
        <p className="text-muted-foreground mb-6 max-w-2xl text-sm sm:text-base">
          If any of this sounds like you, we’d like to hear from you.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {WHAT_WE_SEEK.map(({ icon: Icon, title, text }) => (
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

      <section className="mb-14">
        <h2 className="text-foreground mb-2 text-xl font-bold tracking-tight sm:text-2xl">
          How to connect
        </h2>
        <p className="text-muted-foreground mb-6 max-w-2xl text-sm sm:text-base">
          Simple process — no long forms, just a clear conversation.
        </p>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((item) => (
            <li key={item.step} className="border-border bg-card/50 relative rounded-xl border p-5">
              <span className="text-muted-foreground text-xs font-bold tracking-widest">
                {item.step}
              </span>
              <h3 className="text-foreground mt-2 font-bold">{item.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-border bg-card rounded-2xl border p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
              Got something to propose?
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
              Wholesale & distributors: {SITE.email.trade}. Sponsorships & creative collabs:{' '}
              {SITE.email.partner}. Send a short note with who you are and what you have in mind —
              we read every serious message.
            </p>
            <p className="text-foreground mt-3 text-sm font-medium">{SITE.email.trade}</p>
            <p className="text-foreground text-sm font-medium">{SITE.email.partner}</p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Button asChild size="lg">
              <a href={tradeMail}>
                Email trade <ArrowRight />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={partnerMail}>Email partners</a>
            </Button>
            <Link
              to="/privacy"
              className="text-muted-foreground hover:text-foreground text-xs hover:underline"
            >
              Read our Privacy Policy
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
