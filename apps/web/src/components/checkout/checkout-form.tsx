import {
  type CheckoutInput,
  SHIPPING_COUNTRIES,
  addressSchema,
  isShippingCountry,
  toShippingCountryIso,
} from '@akknerds/shared';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Input,
  Select,
  Spinner,
  useToast,
} from '@akknerds/ui';
import { ApiError, api } from '@akknerds/api-client';
import { Lock } from 'lucide-react';
import { lazy, Suspense, type FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useCheckoutConfig } from '../../hooks/use-checkout-config';
import { useCheckout } from '../../hooks/use-checkout';
import type { CardSubmitFn } from './card-payment-fields';
import type { PaymentUiMethod } from './payment-section';
import { useAuthStore } from '../../store/auth';
import { cartShipping, cartSubtotal, useCartStore } from '../../store/cart';
import { checkoutFingerprint, useCheckoutStore } from '../../store/checkout';

const PaymentSection = lazy(() =>
  import('./payment-section').then((m) => ({ default: m.PaymentSection })),
);

const checkoutFormSchema = addressSchema.extend({
  email: z.string().trim().email('A valid email is required'),
});

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

const CARD_PRIVACY_NOTICE =
  'By paying with your card, you acknowledge that your data will be processed by PayPal subject to the PayPal Privacy Statement available at PayPal.com.';

export function CheckoutForm({ disabled = false }: { disabled?: boolean } = {}) {
  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const currency = 'sek';
  const checkout = useCheckout();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: config } = useCheckoutConfig();
  const checkoutStore = useCheckoutStore();
  const [values, setValues] = useState<FormValues>({ ...EMPTY, email: user?.email ?? '' });
  const [errors, setErrors] = useState<FormErrors & { acceptTerms?: string }>({});
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  const [uiMethod, setUiMethod] = useState<PaymentUiMethod>('card');
  const [cardValid, setCardValid] = useState(false);
  /** False when PayPal SDK eligibility fails — fall back to redirect Pay now. */
  const [cardUiAvailable, setCardUiAvailable] = useState(true);
  const [busy, setBusy] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const cardSubmitRef = useRef<CardSubmitFn | null>(null);

  const cardFieldsEnabled = Boolean(config?.methods.cardFields && config.provider === 'paypal');
  const useCardUi = cardFieldsEnabled && cardUiAvailable;

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

  const validateForm = () => {
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
      return null;
    }
    if (!acceptTerms) {
      setErrors({
        acceptTerms: 'Please accept the Terms and Returns policy to continue',
      });
      return null;
    }
    setErrors({});
    return parsed.data;
  };

  const buildInput = (
    data: z.infer<typeof checkoutFormSchema>,
  ): Omit<CheckoutInput, 'paymentMethod'> => {
    const { email, ...address } = data;
    return {
      email,
      currency,
      items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
      shippingAddress: address,
    };
  };

  const ensureSession = async (
    data: z.infer<typeof checkoutFormSchema>,
    paymentMethod: 'card' | 'paypal' | 'redirect',
  ) => {
    const input = buildInput(data);
    const fingerprint = checkoutFingerprint({
      email: input.email,
      items: input.items,
      shippingAddress: input.shippingAddress,
    });

    const existing = useCheckoutStore.getState();
    if (
      existing.orderId &&
      existing.fingerprint &&
      existing.fingerprint !== fingerprint
    ) {
      try {
        await api.abandonOrder(existing.orderId);
      } catch {
        // best-effort
      }
      checkoutStore.clear();
    }

    const current = useCheckoutStore.getState();
    if (current.orderId && current.fingerprint === fingerprint && current.paypalOrderId) {
      if (paymentMethod !== 'redirect' && current.method === paymentMethod) {
        const refreshed = await api.createPaymentSession(current.orderId, { paymentMethod });
        if (refreshed.status === 'paid') {
          checkoutStore.clear();
          navigate(`/checkout/success?order_id=${encodeURIComponent(current.orderId)}`);
          return null;
        }
        const paypalOrderId = refreshed.paypalOrderId ?? current.paypalOrderId;
        checkoutStore.setSession({
          orderId: current.orderId,
          paypalOrderId,
          method: paymentMethod,
          fingerprint,
        });
        return { orderId: current.orderId, paypalOrderId, url: refreshed.url ?? null };
      }
    }

    if (current.orderId && current.fingerprint === fingerprint && paymentMethod !== 'redirect') {
      const refreshed = await api.createPaymentSession(current.orderId, { paymentMethod });
      if (refreshed.status === 'paid') {
        checkoutStore.clear();
        navigate(`/checkout/success?order_id=${encodeURIComponent(current.orderId)}`);
        return null;
      }
      const paypalOrderId = refreshed.paypalOrderId!;
      checkoutStore.setSession({
        orderId: current.orderId,
        paypalOrderId,
        method: paymentMethod,
        fingerprint,
      });
      return { orderId: current.orderId, paypalOrderId, url: refreshed.url ?? null };
    }

    const session = await checkout.mutateAsync({ ...input, paymentMethod });
    if (session.status === 'paid' && session.url) {
      window.location.assign(session.url);
      return null;
    }
    const paypalOrderId = session.paypalOrderId ?? '';
    checkoutStore.setSession({
      orderId: session.orderId,
      paypalOrderId,
      method: paymentMethod,
      fingerprint,
    });
    return { orderId: session.orderId, paypalOrderId, url: session.url ?? null };
  };

  const onRedirectPay = async (e: FormEvent) => {
    e.preventDefault();
    const data = validateForm();
    if (!data) return;
    setInlineError(null);
    setBusy(true);
    try {
      const session = await ensureSession(data, 'redirect');
      if (!session) return;
      if (session.url) {
        window.location.assign(session.url);
        return;
      }
      throw new Error('PayPal did not return a checkout URL');
    } catch (error) {
      toast({
        title: 'Checkout failed',
        description: error instanceof ApiError ? error.message : 'Please try again.',
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const onCardPay = async (e: FormEvent) => {
    e.preventDefault();
    const data = validateForm();
    if (!data) return;
    if (!cardValid) {
      setInlineError('Please complete your card details.');
      return;
    }
    if (!cardSubmitRef.current) {
      setInlineError('Card fields are still loading. Please try again.');
      return;
    }

    setInlineError(null);
    setBusy(true);
    checkoutStore.setPhase('creating');
    try {
      const session = await ensureSession(data, 'card');
      if (!session) return;

      checkoutStore.setPhase('submitting');
      const result = await cardSubmitRef.current(session.paypalOrderId, {
        streetAddress: data.line1,
        city: data.city,
        postalCode: data.postalCode,
        countryCode: toShippingCountryIso(data.country),
      });

      if (result.state === 'canceled') {
        setInlineError('Authentication was cancelled. You can try again.');
        checkoutStore.setPhase('ready');
        return;
      }
      if (result.state === 'failed') {
        setInlineError(result.message || 'Card payment failed. Please try again.');
        checkoutStore.setPhase('error');
        return;
      }

      checkoutStore.setPhase('capturing');
      await api.capturePayment(session.orderId, { paypalOrderId: session.paypalOrderId });
      checkoutStore.clear();
      navigate(`/checkout/success?order_id=${encodeURIComponent(session.orderId)}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 402) {
        setInlineError(
          error.message || 'Your card was declined. Try another card or pay with PayPal instead.',
        );
      } else {
        toast({
          title: 'Checkout failed',
          description: error instanceof ApiError ? error.message : 'Please try again.',
          variant: 'error',
        });
      }
      checkoutStore.setPhase('error');
    } finally {
      setBusy(false);
    }
  };

  const ensurePaypalOrder = async () => {
    const data = validateForm();
    if (!data) throw new Error('Please complete the shipping form first.');
    const session = await ensureSession(data, 'paypal');
    if (!session) throw new Error('Order already paid');
    return { orderId: session.orderId, paypalOrderId: session.paypalOrderId };
  };

  const amountOre = cartSubtotal(items) + cartShipping(items);

  const onSubmit = useCardUi && uiMethod === 'card' ? onCardPay : onRedirectPay;
  const payDisabled =
    disabled ||
    busy ||
    checkout.isPending ||
    items.length === 0 ||
    (useCardUi && uiMethod === 'card' && !cardValid);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Shipping & contact</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <p className="text-muted-foreground text-sm">
            All transactions are secure and encrypted.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {cardFieldsEnabled && config ? (
            <Suspense
              fallback={
                <div className="flex justify-center py-4">
                  <Spinner label="Loading payment" />
                </div>
              }
            >
              <PaymentSection
                config={config}
                amountOre={amountOre}
                method={uiMethod}
                onMethodChange={setUiMethod}
                onCardValidityChange={setCardValid}
                onUnavailable={() => {
                  setCardUiAvailable(false);
                  setCardValid(false);
                }}
                cardSubmitRef={cardSubmitRef}
                ensurePaypalOrder={ensurePaypalOrder}
                disabled={disabled || busy}
              />
            </Suspense>
          ) : null}

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

          {inlineError || checkoutStore.error ? (
            <Alert variant="destructive">{inlineError || checkoutStore.error}</Alert>
          ) : null}

          {useCardUi && uiMethod === 'card' ? (
            <p className="text-muted-foreground text-xs leading-relaxed">{CARD_PRIVACY_NOTICE}</p>
          ) : null}

          {!(useCardUi && uiMethod === 'paypal') ? (
            <Button type="submit" size="lg" block disabled={payDisabled}>
              {busy || checkout.isPending ? <Spinner className="text-primary-foreground" /> : <Lock />}
              Pay now
            </Button>
          ) : null}

          {!useCardUi ? (
            <Button
              type="button"
              variant="outline"
              size="lg"
              block
              disabled={disabled || busy || items.length === 0}
              onClick={(e) => void onRedirectPay(e as unknown as FormEvent)}
            >
              Continue with PayPal
            </Button>
          ) : (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-center text-xs underline-offset-2 hover:underline disabled:opacity-50"
              disabled={disabled || busy || items.length === 0}
              onClick={(e) => void onRedirectPay(e as unknown as FormEvent)}
            >
              Trouble with the buttons? Continue on PayPal
            </button>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
