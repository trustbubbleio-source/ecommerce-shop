import { Button, cn } from '@akknerds/ui';
import { ArrowRight, Mail, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaqAccordionItem } from '../components/common/faq-accordion';
import { PageHeader } from '../components/common/page-header';
import { FAQ_SECTIONS } from '../config/faq';
import { SITE } from '../config/site';

function FaqHero() {
  return (
    <section className="border-border relative -mx-[max(1rem,calc((100vw-100%)/2))] mb-10 overflow-hidden border-b px-[max(1rem,calc((100vw-100%)/2))]">
      <div className="aurora pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
      <div className="container relative py-10 sm:py-12">
        <p className="text-primary mb-3 text-xs font-semibold uppercase tracking-widest">
          Help centre
        </p>
        <h2 className="text-foreground max-w-xl text-2xl font-extrabold tracking-tight sm:text-3xl">
          Answers to the questions collectors ask most.
        </h2>
        <p className="text-muted-foreground mt-3 max-w-lg text-sm sm:text-base">
          Delivery, payments, orders, and returns — everything you need before and after you buy.
        </p>
      </div>
    </section>
  );
}

function CategoryNav({ activeId }: { activeId: string }) {
  return (
    <nav
      aria-label="FAQ categories"
      className="no-scrollbar -mx-1 mb-10 flex gap-2 overflow-x-auto pb-1"
    >
      {FAQ_SECTIONS.map((section) => {
        const Icon = section.icon;
        const active = activeId === section.id;
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            className={cn(
              'border-border bg-card/50 inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              active
                ? 'border-primary/40 bg-primary/15 text-primary'
                : 'text-muted-foreground hover:border-primary/25 hover:text-foreground',
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {section.title}
          </a>
        );
      })}
    </nav>
  );
}

function ContactCta() {
  return (
    <aside className="border-border from-primary/10 via-card to-card relative mt-14 overflow-hidden rounded-2xl border bg-gradient-to-br p-6 sm:p-8">
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-primary/20 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="text-primary flex items-center gap-2 text-sm font-semibold">
            <MessageCircle className="size-4" aria-hidden />
            Still need help?
          </div>
          <p className="text-foreground text-lg font-bold sm:text-xl">
            Our team replies within one business day.
          </p>
          <p className="text-muted-foreground max-w-md text-sm">
            Could not find what you were looking for? Send us a message and we will get back to you
            Mon–Fri.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Button asChild size="lg">
            <Link to="/contact">
              Contact us <ArrowRight />
            </Link>
          </Button>
          <a
            href={`mailto:${SITE.emailContact}`}
            className="text-muted-foreground hover:text-primary inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <Mail className="size-4" aria-hidden />
            {SITE.emailContact}
          </a>
        </div>
      </div>
    </aside>
  );
}

export function FaqPage() {
  const location = useLocation();
  const [activeSection, setActiveSection] = useState(FAQ_SECTIONS[0]!.id);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && FAQ_SECTIONS.some((section) => section.id === hash)) {
      setActiveSection(hash);
      const el = document.getElementById(hash);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const ids = FAQ_SECTIONS.map((section) => section.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="container max-w-3xl py-8">
      <PageHeader
        title="FAQ"
        description="Quick answers about shipping, payments, orders, and returns."
      />

      <FaqHero />
      <CategoryNav activeId={activeSection} />

      <div className="flex flex-col gap-12">
        {FAQ_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <div className="mb-4 flex items-center gap-3">
                <span className="bg-primary/15 text-primary grid size-10 place-items-center rounded-lg">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h2 className="text-foreground text-xl font-extrabold tracking-tight sm:text-2xl">
                  {section.title}
                </h2>
              </div>
              <div className="flex flex-col gap-2">
                {section.items.map((item, index) => (
                  <FaqAccordionItem
                    key={item.question}
                    question={item.question}
                    answer={item.answer}
                    defaultOpen={index === 0 && section.id === 'shipping'}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <ContactCta />
    </div>
  );
}
