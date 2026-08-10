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
      <div className="container py-10 sm:py-12">
        <div className="border-primary/25 from-primary/10 via-card to-accent/5 relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 sm:p-8 lg:p-10">
          <div
            className="aurora pointer-events-none absolute inset-0 opacity-40"
            aria-hidden="true"
          />
          <div
            className="bg-grid-faint pointer-events-none absolute inset-0 opacity-15 [background-size:28px_28px]"
            aria-hidden="true"
          />

          <div className="relative grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)] lg:items-center lg:gap-10">
            <div className="flex flex-col gap-3">
              <span className="bg-primary/15 text-primary grid size-11 place-items-center rounded-xl">
                <Mail className="size-5" aria-hidden />
              </span>
              <h2
                id="newsletter-heading"
                className="text-2xl font-extrabold tracking-tight sm:text-3xl"
              >
                {NEWSLETTER.title}
              </h2>
              <p className="text-muted-foreground max-w-md text-sm leading-relaxed sm:text-base">
                {NEWSLETTER.subtitle}
              </p>
            </div>

            <form
              onSubmit={onSubmit}
              className="flex w-full flex-col gap-2 sm:flex-row sm:items-start"
              noValidate
            >
              <div className="min-w-0 flex-1">
                <label className="sr-only" htmlFor="newsletter-email">
                  Email address
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
                  placeholder={NEWSLETTER.placeholder}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'newsletter-error' : undefined}
                  className="bg-background/80 h-11"
                />
                {error ? (
                  <p id="newsletter-error" className="text-destructive mt-1.5 text-xs" role="alert">
                    {error}
                  </p>
                ) : null}
              </div>
              <Button type="submit" size="lg" disabled={pending} className="sm:min-w-32">
                {pending ? 'Joining…' : NEWSLETTER.cta}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
