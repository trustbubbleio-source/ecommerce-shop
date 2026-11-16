import { Field } from '@akknerds/ui';
import { useEffect, useState, type MutableRefObject } from 'react';
import {
  PayPalCardCvvField,
  PayPalCardExpiryField,
  PayPalCardNameField,
  PayPalCardNumberField,
  PayPalCardFieldsProvider,
  usePayPalCardFieldsOneTimePaymentSession,
  type CardSubmitResult,
} from '../../lib/paypal';

const FIELD_STYLE = {
  input: {
    'font-size': '16px',
    'font-family': 'system-ui, sans-serif',
    color: '#f5f3ff',
  },
  '.invalid': {
    color: '#fca5a5',
  },
  ':focus': {
    color: '#ffffff',
  },
} as const;

const FIELD_CONTAINER = {
  height: '3rem',
  width: '100%',
} as const;

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

function CardFieldsInner({
  onValidityChange,
  submitRef,
}: Omit<CardPaymentFieldsProps, 'amountValue'>) {
  const { submit, submitResponse, error } = usePayPalCardFieldsOneTimePaymentSession();
  const [pending, setPending] = useState(false);
  const [resolver, setResolver] = useState<{
    resolve: (value: CardSubmitResult) => void;
  } | null>(null);

  // Parent already tracks validity via provider events; keep hook for Pay gating.
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
      <Field label="Name on card" required>
        {() => (
          <div className="border-input bg-background overflow-hidden rounded-md border">
            <PayPalCardNameField
              style={FIELD_STYLE}
              containerStyles={FIELD_CONTAINER}
              placeholder="Name on card"
            />
          </div>
        )}
      </Field>
      <Field label="Card number" required>
        {() => (
          <div className="border-input bg-background overflow-hidden rounded-md border">
            <PayPalCardNumberField
              style={FIELD_STYLE}
              containerStyles={FIELD_CONTAINER}
              placeholder="Card number"
            />
          </div>
        )}
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Expiry" required>
          {() => (
            <div className="border-input bg-background overflow-hidden rounded-md border">
              <PayPalCardExpiryField
                style={FIELD_STYLE}
                containerStyles={FIELD_CONTAINER}
                placeholder="MM/YY"
              />
            </div>
          )}
        </Field>
        <Field label="CVV" required>
          {() => (
            <div className="border-input bg-background overflow-hidden rounded-md border">
              <PayPalCardCvvField
                style={FIELD_STYLE}
                containerStyles={FIELD_CONTAINER}
                placeholder="CVV"
              />
            </div>
          )}
        </Field>
      </div>
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
