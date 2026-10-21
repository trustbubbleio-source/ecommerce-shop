import { ApiError } from '@akknerds/api-client';
import { newsletterSubscribeInputSchema } from '@akknerds/shared';
import { Button, Input, useToast } from '@akknerds/ui';
import { Mail } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { NEWSLETTER } from '../../config/site';
import { useNewsletterSubscribe } from '../../hooks/use-newsletter';

export function NewsletterSubscribe({ className }: { className?: string }) {
  const { toast } = useToast();
  const subscribe = useNewsletterSubscribe();
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = newsletterSubscribeInputSchema.safeParse({
      email,
      consent: consent ? true : false,
    });
    if (!parsed.success) {
      const issues = parsed.error.issues;
      setError(issues.find((i) => i.path[0] === 'email')?.message ?? null);
      setConsentError(issues.find((i) => i.path[0] === 'consent')?.message ?? null);
      return;
    }
    setError(null);
    setConsentError(null);
    try {
      const result = await subscribe.mutateAsync(parsed.data);
      setEmail('');
      setConsent(false);
      toast({
        title: NEWSLETTER.successTitle,
        description: result.message,
        variant: 'success',
      });
    } catch (err) {
      toast({
        title: 'Could not subscribe',
        description: err instanceof ApiError ? err.message : 'Please try again.',
        variant: 'error',
      });
    }
  };

  return (
    <section className={className} aria-labelledby="newsletter-heading">
      <div className="container mb-10 py-10 sm:py-12">
        <div className="border-border bg-card relative overflow-hidden rounded-2xl border p-6 sm:p-8 lg:p-10">
          <div
            className="from-foreground/[0.04] pointer-events-none absolute inset-0 bg-gradient-to-br via-transparent to-transparent"
            aria-hidden="true"
          />
          <div
            className="bg-grid-faint pointer-events-none absolute inset-0 opacity-10 [background-size:28px_28px]"
            aria-hidden="true"
          />

          <div className="relative grid gap-6 lg:grid-cols-[1fr_minmax(0,24rem)] lg:items-center lg:gap-10">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="bg-secondary text-foreground grid size-10 shrink-0 place-items-center rounded-xl sm:size-11">
                  <Mail className="size-5" aria-hidden />
                </span>
                <h2
                  id="newsletter-heading"
                  className="text-2xl font-extrabold tracking-tight sm:text-3xl"
                >
                  {NEWSLETTER.title}
                </h2>
              </div>
              <p className="text-muted-foreground max-w-md text-sm leading-relaxed sm:text-base">
                {NEWSLETTER.subtitleLines[0]}
                <br />
                {NEWSLETTER.subtitleLines[1]}
              </p>
            </div>

            <form onSubmit={onSubmit} className="flex w-full flex-col gap-3" noValidate>
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch">
                <div className="relative min-w-0 flex-1">
                  <label
                    htmlFor="newsletter-email"
                    className="text-muted-foreground pointer-events-none absolute left-3.5 top-1.5 z-10 text-[10px] font-semibold uppercase tracking-wider"
                  >
                    Email
                  </label>
                  <Input
                    id="newsletter-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'newsletter-error' : undefined}
                    className="bg-background h-11 rounded-lg px-3.5 pb-1.5 pt-5 text-sm shadow-none"
                  />
                  {error ? (
                    <p id="newsletter-error" className="text-destructive mt-1.5 text-xs" role="alert">
                      {error}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="submit"
                  size="md"
                  disabled={subscribe.isPending}
                  className="h-11 shrink-0 sm:min-w-28"
                >
                  {subscribe.isPending ? 'Joining…' : NEWSLETTER.cta}
                </Button>
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-snug sm:text-sm">
                <input
                  type="checkbox"
                  className="border-input text-primary focus-visible:ring-ring mt-0.5 size-4 shrink-0 rounded accent-primary"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (consentError) setConsentError(null);
                  }}
                  aria-invalid={Boolean(consentError)}
                  aria-describedby={consentError ? 'newsletter-consent-error' : undefined}
                />
                <span className="text-muted-foreground">
                  I want drop alerts and restocks by email. See our{' '}
                  <Link to="/privacy" className="text-primary font-medium hover:underline">
                    Privacy Policy
                  </Link>
                  . Unsubscribe any time.
                </span>
              </label>
              {consentError ? (
                <p id="newsletter-consent-error" className="text-destructive text-xs" role="alert">
                  {consentError}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
