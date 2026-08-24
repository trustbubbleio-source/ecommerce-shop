import { contactInputSchema } from '@akknerds/shared';
import { Alert, Button, Field, Input, Spinner, Textarea, useToast } from '@akknerds/ui';
import { ChevronDown, Mail, MapPin, MessageSquare, Send } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/common/page-header';
import { StoreMap } from '../components/common/store-map';
import { SITE } from '../config/site';
import { useContact } from '../hooks/use-contact';
import { ApiError } from '../lib/api';

type Values = { name: string; email: string; subject: string; message: string };
type Errors = Partial<Record<keyof Values, string>>;
const EMPTY: Values = { name: '', email: '', subject: '', message: '' };

export function ContactPage() {
  const contact = useContact();
  const { toast } = useToast();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);

  const set = (key: keyof Values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = contactInputSchema.safeParse(values);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Values;
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    try {
      await contact.mutateAsync(parsed.data);
      setDone(true);
      setValues(EMPTY);
    } catch (error) {
      toast({
        title: 'Message not sent',
        description: error instanceof ApiError ? error.message : 'Please try again.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      <PageHeader
        title="Get in touch"
        description="Questions about an order, a product, or a bulk enquiry? We're happy to help."
      />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:items-start">
        <aside className="flex flex-col gap-6">
          <div className="flex items-start gap-3">
            <span className="bg-secondary text-foreground grid size-10 shrink-0 place-items-center rounded-lg">
              <Mail className="size-5" />
            </span>
            <div>
              <p className="text-foreground font-semibold">Email us</p>
              <a
                href={`mailto:${SITE.email.contact}`}
                className="text-foreground text-sm hover:underline"
              >
                {SITE.email.contact}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="bg-secondary text-foreground grid size-10 shrink-0 place-items-center rounded-lg">
              <MessageSquare className="size-5" />
            </span>
            <div>
              <p className="text-foreground font-semibold">Response time</p>
              <p className="text-muted-foreground text-sm">{SITE.supportHours}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="bg-secondary text-foreground grid size-10 shrink-0 place-items-center rounded-lg">
              <MapPin className="size-5" />
            </span>
            <div>
              <p className="text-foreground font-semibold">Business address</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {SITE.store.street}
                <br />
                {SITE.store.postalCode} {SITE.store.city}
                <br />
                {SITE.store.country}
              </p>
              <p className="text-muted-foreground mt-2 text-xs">
                Physical store opens October 15, 2026.
              </p>
            </div>
          </div>

          <StoreMap />
        </aside>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {done && (
            <Alert variant="success">
              Thanks for reaching out! We'll reply within one business day.
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name} required>
              {(props) => <Input {...props} value={values.name} onChange={set('name')} />}
            </Field>
            <Field label="Email" error={errors.email} required>
              {(props) => (
                <Input {...props} type="email" value={values.email} onChange={set('email')} />
              )}
            </Field>
          </div>
          <Field label="Subject" error={errors.subject} required>
            {(props) => <Input {...props} value={values.subject} onChange={set('subject')} />}
          </Field>
          <Field label="Message" error={errors.message} required>
            {(props) => (
              <Textarea
                {...props}
                rows={6}
                value={values.message}
                onChange={set('message')}
                placeholder="How can we help?"
              />
            )}
          </Field>
          <Button type="submit" size="lg" disabled={contact.isPending} className="self-start">
            {contact.isPending ? <Spinner className="text-primary-foreground" /> : <Send />}
            Send message
          </Button>
          <p className="text-muted-foreground text-xs leading-relaxed">
            By contacting us you agree that we may use your details to respond to your enquiry. Read
            our{' '}
            <Link to="/privacy" className="text-foreground font-medium hover:underline">
              Privacy Policy
            </Link>
            . Interested in wholesale, sponsorship, or a collab? See{' '}
            <Link to="/partners" className="text-foreground font-medium hover:underline">
              Looking for partners
            </Link>
            .
          </p>
        </form>
      </div>

      <div className="border-border bg-card/40 mt-14 overflow-hidden rounded-2xl border">
        <nav
          aria-label="Policies"
          className="text-muted-foreground/70 border-border/70 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b px-5 py-3 text-[11px]"
        >
          <Link to="/shipping" className="hover:text-muted-foreground hover:underline">
            Shipping
          </Link>
          <Link to="/returns" className="hover:text-muted-foreground hover:underline">
            Returns
          </Link>
          <Link to="/terms" className="hover:text-muted-foreground hover:underline">
            Terms
          </Link>
          <Link to="/privacy" className="hover:text-muted-foreground hover:underline">
            Privacy
          </Link>
          <Link to="/cookies" className="hover:text-muted-foreground hover:underline">
            Cookies
          </Link>
        </nav>

        <details className="group open:pb-1">
          <summary className="text-foreground flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold tracking-wide [&::-webkit-details-marker]:hidden">
            <span>Business information</span>
            <ChevronDown className="text-muted-foreground size-4 shrink-0 transition-transform group-open:rotate-180" />
          </summary>
          <div className="border-border text-muted-foreground border-t px-5 py-5 text-sm leading-relaxed">
            <p>
              {SITE.legalName} is a Swedish {SITE.legalForm.toLowerCase()} based at{' '}
              {SITE.store.line}. For invoices and tax purposes we use VAT number {SITE.vatNumber}.
              Organisation number and the full trader register details appear in our{' '}
              <Link
                to="/terms"
                className="text-muted-foreground underline-offset-2 hover:underline"
              >
                Terms & Conditions
              </Link>
              .
            </p>
            <p className="mt-3">
              Prefer email? Start with{' '}
              <a
                href={`mailto:${SITE.email.contact}`}
                className="underline-offset-2 hover:underline"
              >
                {SITE.email.contact}
              </a>{' '}
              or use the department addresses below when you already know the topic.
            </p>
            <ul className="text-muted-foreground/70 mt-4 grid list-none gap-x-6 gap-y-1 p-0 text-[11px] sm:grid-cols-2">
              {(
                [
                  ['Contact', SITE.email.contact],
                  ['Support', SITE.email.support],
                  ['Orders', SITE.email.orders],
                  ['Returns', SITE.email.returns],
                  ['Billing', SITE.email.billing],
                  ['Privacy', SITE.email.privacy],
                  ['Partners', SITE.email.partner],
                  ['Trade', SITE.email.trade],
                ] as const
              ).map(([label, address]) => (
                <li key={address} className="flex min-w-0 gap-1.5">
                  <span className="text-muted-foreground/50 w-14 shrink-0">{label}</span>
                  <a
                    href={`mailto:${address}`}
                    className="hover:text-muted-foreground truncate underline-offset-2 hover:underline"
                  >
                    {address}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
}
