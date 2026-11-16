import { Field } from '@akknerds/ui';
import { CircleHelp } from 'lucide-react';
import { useEffect, useState, type MutableRefObject, type ReactNode } from 'react';
import {
  PayPalCardCvvField,
  PayPalCardExpiryField,
  PayPalCardNameField,
  PayPalCardNumberField,
  PayPalCardFieldsProvider,
  usePayPalCardFieldsOneTimePaymentSession,
  type CardSubmitResult,
} from '../../lib/paypal';
import { CardBrandIcons } from './card-brand-icons';

/** Match `@akknerds/ui` Input tokens so PayPal iframes sit in the same shell. */
const FIELD_STYLE = {
  input: {
    'font-size': '14px',
    'font-family': 'system-ui, sans-serif',
    'font-weight': '400',
    'padding': '0 0.875rem',
    color: 'hsl(var(--foreground))',
  },
  '.invalid': {
    color: 'hsl(var(--destructive))',
  },
  ':focus': {
    color: 'hsl(var(--foreground))',
  },
  '.valid': {
    color: 'hsl(var(--foreground))',
  },
} as const;

const FIELD_CONTAINER = {
  height: '2.75rem',
  width: '100%',
} as const;

/** Extra right padding inside PayPal iframe so overlay icons don't collide with typed digits. */
const NUMBER_FIELD_STYLE = {
  ...FIELD_STYLE,
  input: {
    ...FIELD_STYLE.input,
    'padding-right': '8.25rem',
  },
} as const;

const CVV_FIELD_STYLE = {
  ...FIELD_STYLE,
  input: {
    ...FIELD_STYLE.input,
    'padding-right': '2.75rem',
  },
} as const;

const fieldShellClass =
  'border-input bg-background relative rounded-lg border shadow-sm transition-colors focus-within:border-ring focus-within:ring-ring/40 focus-within:ring-2';

export type CardSubmitFn = (
  paypalOrderId: string,
  billing: {
    streetAddress: string;
    city: string;
    postalCode: string;
    countryCode: string;
  },
) => Promise<CardSubmitResult>;

export interface CardPaymentFieldsProps {
  amountValue: string;
  onValidityChange: (valid: boolean) => void;
  submitRef: MutableRefObject<CardSubmitFn | null>;
}

function FieldShell({
  children,
  adornment,
}: {
  children: ReactNode;
  adornment?: ReactNode;
}) {
  return (
    <div className={fieldShellClass}>
      {/* Keep iframe clip separate so CVV tooltip can escape above the field. */}
      <div className="overflow-hidden rounded-[inherit]">{children}</div>
      {adornment ? (
        <div className="pointer-events-none absolute inset-y-0 right-2 z-20 flex items-center gap-1">
          {adornment}
        </div>
      ) : null}
    </div>
  );
}

/** Hover/focus tip rendered above the field (parent must not clip overflow). */
function CvvHelpTip() {
  return (
    <span className="group/cvv pointer-events-auto relative inline-flex">
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring bg-background/90 inline-flex size-8 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2"
        aria-label="What is the security code?"
      >
        <CircleHelp className="size-5" strokeWidth={2} aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className="border-border bg-popover text-popover-foreground pointer-events-none absolute bottom-full right-0 z-50 mb-2 hidden w-56 rounded-md border px-3 py-2.5 text-left text-xs leading-snug shadow-lg group-hover/cvv:block group-focus-within/cvv:block"
      >
        The 3-digit code on the back of your card (or 4 digits on the front for American Express).
      </span>
    </span>
  );
}

function CardFieldsInner({
  onValidityChange,
  submitRef,
}: Omit<CardPaymentFieldsProps, 'amountValue'>) {
  const { submit, submitResponse, error } = usePayPalCardFieldsOneTimePaymentSession();
  const [pending, setPending] = useState(false);
  const [resolver, setResolver] = useState<{
    resolve: (value: CardSubmitResult) => void;
  } | null>(null);

  void onValidityChange;

  useEffect(() => {
    if (!pending || !resolver) return;
    if (error) {
      resolver.resolve({ state: 'failed', message: error.message });
      setPending(false);
      setResolver(null);
      return;
    }
    if (submitResponse) {
      resolver.resolve({
        state: submitResponse.state,
        orderId: submitResponse.data?.orderId,
        liabilityShift: submitResponse.data?.liabilityShift,
        message: submitResponse.data?.message,
      });
      setPending(false);
      setResolver(null);
    }
  }, [pending, resolver, submitResponse, error]);

  useEffect(() => {
    submitRef.current = async (paypalOrderId, billing) => {
      return new Promise<CardSubmitResult>((resolve) => {
        setResolver({ resolve });
        setPending(true);
        void submit(paypalOrderId, {
          billingAddress: {
            addressLine1: billing.streetAddress,
            adminArea2: billing.city,
            postalCode: billing.postalCode,
            countryCode: billing.countryCode,
          },
        });
      });
    };
    return () => {
      submitRef.current = null;
    };
  }, [submit, submitRef]);

  return (
    <div className="flex flex-col gap-4">
      <Field label="Card number" required>
        {() => (
          <FieldShell adornment={<CardBrandIcons />}>
            <PayPalCardNumberField
              style={NUMBER_FIELD_STYLE}
              containerStyles={FIELD_CONTAINER}
              placeholder="Card number"
            />
          </FieldShell>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Expiry" required>
          {() => (
            <FieldShell>
              <PayPalCardExpiryField
                style={FIELD_STYLE}
                containerStyles={FIELD_CONTAINER}
                placeholder="MM/YY"
              />
            </FieldShell>
          )}
        </Field>
        <Field label="Security code" required>
          {() => (
            <FieldShell adornment={<CvvHelpTip />}>
              <PayPalCardCvvField
                style={CVV_FIELD_STYLE}
                containerStyles={FIELD_CONTAINER}
                placeholder="CVV"
              />
            </FieldShell>
          )}
        </Field>
      </div>

      <Field label="Name on card" required>
        {() => (
          <FieldShell>
            <PayPalCardNameField
              style={FIELD_STYLE}
              containerStyles={FIELD_CONTAINER}
              placeholder="Name on card"
            />
          </FieldShell>
        )}
      </Field>
    </div>
  );
}

function isFieldsValid(event: unknown): boolean {
  const payload = event as {
    fields?: Record<string, { isValid?: boolean; valid?: boolean }>;
    isValid?: boolean;
    valid?: boolean;
  };
  if (payload.fields) {
    const values = Object.values(payload.fields);
    if (values.length === 0) return false;
    return values.every((field) => Boolean(field.isValid ?? field.valid));
  }
  return Boolean(payload.isValid ?? payload.valid);
}

export function CardPaymentFields({
  amountValue,
  onValidityChange,
  submitRef,
}: CardPaymentFieldsProps) {
  return (
    <PayPalCardFieldsProvider
      amount={{ value: amountValue, currencyCode: 'SEK' }}
      validitychange={(event) => onValidityChange(isFieldsValid(event))}
    >
      <CardFieldsInner onValidityChange={onValidityChange} submitRef={submitRef} />
    </PayPalCardFieldsProvider>
  );
}
