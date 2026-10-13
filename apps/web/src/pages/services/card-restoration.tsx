import { Button } from '@akknerds/ui';
import {
  ArrowRight,
  Camera,
  Check,
  Droplets,
  Layers,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/common/page-header';
import { RestorationAssessmentForm } from '../../components/services/restoration-assessment-form';
import { SITE } from '../../config/site';

const PACKAGES: {
  icon: typeof Droplets;
  name: string;
  blurb: string;
  includes: string[];
  bestFor: string;
  featured?: boolean;
}[] = [
  {
    icon: Droplets,
    name: 'Surface Clean',
    blurb: 'For cards that mainly need a careful clean before display, trade or a grading decision.',
    includes: [
      'Dust and loose debris removal',
      'Fingerprint and surface-oil reduction',
      'Light surface wipe',
      'Magnified edge & corner check',
      'Returned sleeved and toploaded',
    ],
    bestFor: 'Grime, fingerprints, handling marks',
  },
  {
    icon: Sparkles,
    name: 'Clean & Prep',
    blurb:
      'Cleaning plus presentation prep so the card is ready for a binder, trade night or submission pack.',
    includes: [
      'Everything in Surface Clean',
      'Holo / foil polish when appropriate',
      'Edge fluff tidy-up',
      'Visual pre-grade notes',
      'Grading-ready sleeve & toploader finish',
    ],
    bestFor: 'Pre-grading, chase singles, holo haze',
    featured: true,
  },
  {
    icon: Layers,
    name: 'Restore & Press',
    blurb:
      'Focused hand work for light physical issues. Always conservative, never aggressive alteration.',
    includes: [
      'Everything in Clean & Prep',
      'Minor curl / waviness reduction',
      'Light bend easing when safe',
      'Localized dent treatment when suitable',
      'Before & after photo notes',
    ],
    bestFor: 'Binder bends, light curls, pressure marks',
  },
];

const ADD_ONS = [
  { title: 'Photo condition report', text: 'Written notes on surface, edges, corners and centering.' },
  { title: 'Centering read', text: 'Front/back visual ratios vs common grading tolerances.' },
  { title: 'Slab crack & clean', text: 'Careful crack-out, then clean/prep of the raw card.' },
  { title: 'Grading hand-off', text: 'Pair restoration with our grading submission service.' },
] as const;

const WE_CAN = [
  'Surface grime, fingerprints and residue',
  'Light holo haze and presentation polish',
  'Minor curls, soft binder bends and waviness',
  'Isolated light dents / pressure marks',
  'Edge fluff and soft corner tidy-up when safe',
] as const;

const WE_CANT = [
  'Rebuild missing pieces or torn corners',
  'Hide deep creases that go through the stock',
  'Fix water damage that split layers',
  'Repaint, recolour or “fake” print detail',
  'Guarantee a PSA / CGC / BGS grade',
] as const;

const STEPS = [
  {
    step: '01',
    icon: Camera,
    title: 'Send clear photos',
    text: 'Front, back and a close-up of the issue. Tell us your goal: display, trade or grading.',
  },
  {
    step: '02',
    icon: Search,
    title: 'Free assessment',
    text: 'We reply with what can improve, what can’t, a recommended package and a quote. No work starts until you approve.',
  },
  {
    step: '03',
    icon: Package,
    title: 'Drop-off or mail-in',
    text: `Bring cards to the Båstad store or ship them securely. We’ll confirm intake and start the agreed treatment.`,
  },
  {
    step: '04',
    icon: ShieldCheck,
    title: 'Careful work & return',
    text: 'Conservative hand treatment, documentation of what we did, then sleeved return ready for the next step.',
  },
] as const;

export function CardRestorationPage() {
  return (
    <div className="container max-w-5xl py-8">
      <PageHeader
        title="Card Restoration"
        description="Professional cleaning and conservative restoration for Pokémon TCG, so your cards look their best for display, trade nights or grading prep."
      />

      <section className="border-border bg-card mb-12 overflow-hidden rounded-2xl border">
        <div className="from-foreground/[0.05] relative bg-gradient-to-br via-transparent to-transparent px-6 py-10 sm:px-10 sm:py-12">
          <div
            className="bg-grid-faint pointer-events-none absolute inset-0 opacity-20 [background-size:28px_28px]"
            aria-hidden
          />
          <div className="relative">
            <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-[0.18em]">
              Cleaning · Prep · Restoration
            </p>
            <h2 className="text-foreground max-w-2xl text-2xl font-extrabold tracking-tight sm:text-3xl">
              Honest card care. No miracle grades, just better presentation.
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl text-sm leading-relaxed sm:text-base">
              We clean and restore by hand with a conservation mindset: improve what is safely
              improvable, leave permanent damage alone, and tell you the difference up front. Photo
              assessment is free; every card is quoted individually.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href="#assessment">
                  Start photo assessment <ArrowRight />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/services/grading-submission">Grading submission</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-foreground mb-2 text-xl font-bold tracking-tight sm:text-2xl">
          Service packages
        </h2>
        <p className="text-muted-foreground mb-6 max-w-2xl text-sm sm:text-base">
          Pick the level that matches the card. Final price comes after we see photos, because
          condition varies too much for a blanket rate.
        </p>
        <div className="grid gap-4 lg:grid-cols-3">
          {PACKAGES.map(({ icon: Icon, name, blurb, includes, bestFor, featured }) => (
            <article
              key={name}
              className={
                featured
                  ? 'border-foreground/25 bg-card relative flex flex-col rounded-2xl border p-5 shadow-[0_0_0_1px_hsl(var(--foreground)/0.06)]'
                  : 'border-border bg-card/50 flex flex-col rounded-2xl border p-5'
              }
            >
              {featured ? (
                <span className="bg-foreground text-background absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Most requested
                </span>
              ) : null}
              <span className="bg-secondary text-foreground grid size-10 place-items-center rounded-lg">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="text-foreground mt-4 text-lg font-bold">{name}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{blurb}</p>
              <p className="text-foreground mt-3 text-xs font-semibold uppercase tracking-[0.14em]">
                Best for · {bestFor}
              </p>
              <ul className="text-muted-foreground mt-4 flex flex-1 flex-col gap-2 text-sm">
                {includes.map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="text-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground border-border mt-5 border-t pt-4 text-xs">
                Quoted per card after photo review
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-foreground mb-2 text-xl font-bold tracking-tight sm:text-2xl">
          Optional add-ons
        </h2>
        <p className="text-muted-foreground mb-6 max-w-2xl text-sm sm:text-base">
          Stack these when you want more insight or a smoother path into grading.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {ADD_ONS.map((item) => (
            <div
              key={item.title}
              className="border-border bg-card/40 flex flex-col gap-1 rounded-xl border px-4 py-4"
            >
              <h3 className="text-foreground text-sm font-bold">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14 grid gap-4 md:grid-cols-2">
        <div className="border-border bg-card/50 rounded-2xl border p-5 sm:p-6">
          <h2 className="text-foreground text-lg font-bold tracking-tight">What we can help with</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {WE_CAN.map((item) => (
              <li key={item} className="text-muted-foreground flex gap-2 text-sm leading-relaxed">
                <Check className="text-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-border bg-card/50 rounded-2xl border p-5 sm:p-6">
          <h2 className="text-foreground text-lg font-bold tracking-tight">What we won’t claim</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {WE_CANT.map((item) => (
              <li key={item} className="text-muted-foreground flex gap-2 text-sm leading-relaxed">
                <X className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="text-foreground mb-2 text-xl font-bold tracking-tight sm:text-2xl">
          How it works
        </h2>
        <p className="text-muted-foreground mb-6 max-w-2xl text-sm sm:text-base">
          Photo first. Quote second. Work only after you say go.
        </p>
        <ol className="grid gap-4 sm:grid-cols-2">
          {STEPS.map(({ step, icon: Icon, title, text }) => (
            <li key={step} className="border-border bg-card/50 relative rounded-xl border p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs font-bold tracking-widest">{step}</span>
                <span className="bg-secondary text-foreground grid size-9 place-items-center rounded-lg">
                  <Icon className="size-4" aria-hidden />
                </span>
              </div>
              <h3 className="text-foreground mt-3 font-bold">{title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-border bg-secondary/40 mb-14 rounded-2xl border px-5 py-5 sm:px-6">
        <h2 className="text-foreground text-sm font-bold uppercase tracking-[0.14em]">
          Grading & disclosure
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          Restoration improves presentation; it does not invent a grade. Companies like PSA, CGC and
          BGS set the final call, and some treatments may be disclosed or rejected if they count as
          alteration. We prefer conservative, grading-aware work and will say when “leave it alone”
          is the smarter move. Planning to submit? Pair this with{' '}
          <Link
            to="/services/grading-submission"
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            Grading Submission
          </Link>
          .
        </p>
      </section>

      <section id="assessment" className="mb-14 scroll-mt-24">
        <h2 className="text-foreground mb-2 text-xl font-bold tracking-tight sm:text-2xl">
          Request an assessment
        </h2>
        <p className="text-muted-foreground mb-6 max-w-2xl text-sm sm:text-base">
          Ready when you are: snap up to three photos, leave your email, and we review before we
          reply with an honest quote.
        </p>
        <RestorationAssessmentForm />
      </section>

      <section className="border-border bg-card rounded-2xl border p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">
              Prefer email instead?
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed sm:text-base">
              You can still write us directly at {SITE.email.support}. We aim to reply{' '}
              {SITE.supportHours.toLowerCase()}.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Button asChild size="lg">
              <a href={`mailto:${SITE.email.support}?subject=${encodeURIComponent('Card restoration enquiry')}`}>
                Email support <ArrowRight />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/contact">Contact form</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
