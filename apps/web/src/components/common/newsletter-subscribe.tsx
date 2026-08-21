import { Button, Input, useToast } from '@akknerds/ui';
import { Mail } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { NEWSLETTER } from '../../config/site';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterSubscribe({ className }: { className?: string }) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }
    setError(null);
    setPending(true);

    // UI-ready subscribe — wire to a newsletter provider/API when available.
    window.setTimeout(() => {
      setPending(false);
      setEmail('');
      toast({
        title: NEWSLETTER.successTitle,
        description: NEWSLETTER.successDescription,
        variant: 'success',
      });
    }, 350);
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

            <form
              onSubmit={onSubmit}
              className="flex w-full flex-col gap-2 sm:flex-row sm:items-stretch"
              noValidate
            >
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
                disabled={pending}
                className="h-11 shrink-0 sm:min-w-28"
              >
                {pending ? 'Joining…' : NEWSLETTER.cta}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
