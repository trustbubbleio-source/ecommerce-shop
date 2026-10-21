import {
  type CheckoutInput,
  SHIPPING_COUNTRIES,
  addressSchema,
  isShippingCountry,
} from '@akknerds/shared';
import { Alert, Button, Field, Input, Select, Spinner, useToast } from '@akknerds/ui';
import { Lock } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { ApiError } from '@akknerds/api-client';
import { useCheckout } from '../../hooks/use-checkout';
import { useAuthStore } from '../../store/auth';
import { useCartStore } from '../../store/cart';
import { useCurrencyStore } from '../../store/currency';

const checkoutFormSchema = addressSchema.extend({
  email: z.string().trim().email('A valid email is required'),
});

/** Form state allows empty country until the customer picks one. */
type FormValues = {
  email: string;
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  country: string;
};
type FormErrors = Partial<Record<keyof FormValues, string>>;

const EMPTY: FormValues = {
  email: '',
  fullName: '',
  line1: '',
  line2: '',
  city: '',
  postalCode: '',
  country: '',
};

export function CheckoutForm({ disabled = false }: { disabled?: boolean } = {}) {
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const currency = useCurrencyStore((s) => s.currency);
  const checkout = useCheckout();
  const { toast } = useToast();
  const [values, setValues] = useState<FormValues>({ ...EMPTY, email: user?.email ?? '' });
  const [errors, setErrors] = useState<FormErrors & { acceptTerms?: string }>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [prefilled, setPrefilled] = useState(false);

  useEffect(() => {
    if (!user || prefilled) return;
    const ship = user.profile.shippingAddress;
    setValues((current) => ({
      ...current,
      email: user.email || current.email,
      fullName: ship?.fullName || user.name || current.fullName,
      line1: ship?.line1 || current.line1,
      line2: ship?.line2 || current.line2,
      city: ship?.city || current.city,
      postalCode: ship?.postalCode || current.postalCode,
      country:
        ship?.country && isShippingCountry(ship.country) ? ship.country : current.country,
    }));
    setPrefilled(true);
  }, [user, prefilled]);

  const set = (key: keyof FormValues) => (e: { target: { value: string } }) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = checkoutFormSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: FormErrors & { acceptTerms?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormValues;
        fieldErrors[key] ??= issue.message;
      }
      if (!acceptTerms) {
        fieldErrors.acceptTerms = 'Please accept the Terms and Returns policy to continue';
      }
      setErrors(fieldErrors);
      return;
    }
    if (!acceptTerms) {
      setErrors({
        acceptTerms: 'Please accept the Terms and Returns policy to continue',
      });
      return;
    }
    setErrors({});

    const { email, ...address } = parsed.data;
    const input: CheckoutInput = {
      email,
      currency,
      items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      shippingAddress: address,
    };

    try {
      const session = await checkout.mutateAsync(input);
      window.location.assign(session.url);
    } catch (error) {
      toast({
        title: 'Checkout failed',
        description: error instanceof ApiError ? error.message : 'Please try again.',
        variant: 'error',
      });
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {!user && (
        <Alert variant="info">
          Checking out as a guest.{' '}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>{' '}
          for faster checkout and order history.
        </Alert>
      )}
      {user?.profile.shippingAddress && (
        <Alert variant="info">
          We prefilled your default shipping address from your profile. You can edit it for this
          order.
        </Alert>
      )}

      <Field label="Email" error={errors.email} required>
        {(props) => (
          <Input
            {...props}
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={set('email')}
            placeholder="you@example.com"
          />
        )}
      </Field>

      <Field label="Full name" error={errors.fullName} required>
        {(props) => (
          <Input
            {...props}
            autoComplete="name"
            value={values.fullName}
            onChange={set('fullName')}
            placeholder="Ash Ketchum"
          />
        )}
      </Field>

      <Field label="Address" error={errors.line1} required>
        {(props) => (
          <Input
            {...props}
            autoComplete="address-line1"
            value={values.line1}
            onChange={set('line1')}
            placeholder="123 Route 1"
          />
        )}
      </Field>

      <Field label="Apartment, suite, etc. (optional)" error={errors.line2}>
        {(props) => (
          <Input
            {...props}
            autoComplete="address-line2"
            value={values.line2 ?? ''}
            onChange={set('line2')}
          />
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="City" error={errors.city} required>
          {(props) => (
            <Input
              {...props}
              autoComplete="address-level2"
              value={values.city}
              onChange={set('city')}
            />
          )}
        </Field>
        <Field label="Postal code" error={errors.postalCode} required>
          {(props) => (
            <Input
              {...props}
              autoComplete="postal-code"
              value={values.postalCode}
              onChange={set('postalCode')}
            />
          )}
        </Field>
      </div>

      <Field label="Country" error={errors.country} required>
        {(props) => (
          <Select
            {...props}
            autoComplete="country-name"
            value={values.country}
            onChange={set('country')}
            options={[
              { value: '', label: 'Select country' },
              ...SHIPPING_COUNTRIES.map((country) => ({ value: country, label: country })),
            ]}
          />
        )}
      </Field>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-snug">
            <input
              type="checkbox"
              className="border-input text-primary focus-visible:ring-ring mt-0.5 size-4 shrink-0 rounded accent-primary"
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                if (errors.acceptTerms) {
                  setErrors((current) => ({ ...current, acceptTerms: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.acceptTerms)}
              aria-describedby={errors.acceptTerms ? 'checkout-accept-terms-error' : undefined}
            />
            <span className="text-muted-foreground">
              I agree to the{' '}
              <Link
                to="/terms"
                className="text-primary font-medium hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Terms
              </Link>{' '}
              and{' '}
              <Link
                to="/returns"
                className="text-primary font-medium hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Returns &amp; Refunds
              </Link>{' '}
              policy.
            </span>
          </label>
          {errors.acceptTerms ? (
            <p id="checkout-accept-terms-error" className="text-destructive text-xs" role="alert">
              {errors.acceptTerms}
            </p>
          ) : null}
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        block
        disabled={disabled || checkout.isPending || items.length === 0}
      >
        {checkout.isPending ? <Spinner className="text-primary-foreground" /> : <Lock />}
        Pay securely
      </Button>
    </form>
  );
}
