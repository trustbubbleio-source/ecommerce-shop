import { contactInputSchema } from '@akknerds/shared';
import { Alert, Button, Field, Input, Spinner, Textarea, useToast } from '@akknerds/ui';
import { Mail, MapPin, MessageSquare, Send } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { PageHeader } from '../components/common/page-header';
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

      <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-3">
            <span className="bg-primary/15 text-primary grid size-10 shrink-0 place-items-center rounded-lg">
              <Mail className="size-5" />
            </span>
            <div>
              <p className="text-foreground font-semibold">Email us</p>
              <a
                href={`mailto:${SITE.emailContact}`}
                className="text-primary text-sm hover:underline"
              >
                {SITE.emailContact}
              </a>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-primary/15 text-primary grid size-10 shrink-0 place-items-center rounded-lg">
              <MapPin className="size-5" />
            </span>
            <div>
              <p className="text-foreground font-semibold">Physical store</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {SITE.store.street}
                <br />
                {SITE.store.postalCode} {SITE.store.city}
                <br />
                {SITE.store.country}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-primary/15 text-primary grid size-10 shrink-0 place-items-center rounded-lg">
              <MessageSquare className="size-5" />
            </span>
            <div>
              <p className="text-foreground font-semibold">Response time</p>
              <p className="text-muted-foreground text-sm">Within one business day, Mon-Fri.</p>
            </div>
          </div>
        </div>

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
        </form>
      </div>
    </div>
  );
}
