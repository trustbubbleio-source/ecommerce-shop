import type { CheckoutConfig } from '@akknerds/shared';
import { Alert, Spinner } from '@akknerds/ui';
import { useEffect, useMemo, useState, type MutableRefObject, type ReactNode } from 'react';
import {
  PayPalProvider,
  useEligibleMethods,
  type CardSubmitResult,
} from '../../lib/paypal';
import { CardPaymentFields, type CardSubmitFn } from './card-payment-fields';
import { PaypalWalletButton } from './paypal-wallet-button';

export type PaymentUiMethod = 'card' | 'paypal';

interface PaymentSectionProps {
  config: CheckoutConfig;
  amountOre: number;
  method: PaymentUiMethod;
  onMethodChange: (method: PaymentUiMethod) => void;
  onCardValidityChange: (valid: boolean) => void;
  cardSubmitRef: MutableRefObject<CardSubmitFn | null>;
  ensurePaypalOrder: () => Promise<{ orderId: string; paypalOrderId: string }>;
  disabled?: boolean;
}

function EligibilityGate({
  children,
  onIneligible,
}: {
  children: (eligible: { card: boolean; paypal: boolean }) => ReactNode;
  onIneligible: () => void;
}) {
  const { eligiblePaymentMethods, isLoading, error } = useEligibleMethods({
    payload: {
      currencyCode: 'SEK',
    } as never,
  });

  const card =
    Boolean(
      (eligiblePaymentMethods as { isEligible?: (method: string) => boolean } | null)?.isEligible?.(
        'advanced_cards',
      ),
    ) ||
    Boolean((eligiblePaymentMethods as { advanced_cards?: unknown } | null)?.advanced_cards);
  const paypal =
    Boolean(
      (eligiblePaymentMethods as { isEligible?: (method: string) => boolean } | null)?.isEligible?.(
        'paypal',
      ),
    ) || Boolean(eligiblePaymentMethods);

  useEffect(() => {
    if (isLoading) return;
    if (error || (!card && !paypal)) onIneligible();
  }, [isLoading, error, card, paypal, onIneligible]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner label="Loading payment methods" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="info">
        Card fields could not load. You can still pay with PayPal redirect below.
      </Alert>
    );
  }

  return <>{children({ card, paypal })}</>;
}

export function PaymentSection({
  config,
  amountOre,
  method,
  onMethodChange,
  onCardValidityChange,
  cardSubmitRef,
  ensurePaypalOrder,
  disabled,
}: PaymentSectionProps) {
  const [sdkIneligible, setSdkIneligible] = useState(false);
  const amountValue = useMemo(() => (amountOre / 100).toFixed(2), [amountOre]);

  if (sdkIneligible) {
    return null;
  }

  return (
    <PayPalProvider
      clientId={config.clientId}
      environment={config.environment === 'live' ? 'production' : 'sandbox'}
      components={['card-fields', 'paypal-payments']}
      pageType="checkout"
      locale={config.locale}
    >
      <EligibilityGate onIneligible={() => setSdkIneligible(true)}>
        {({ card, paypal }) => (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2" role="tablist" aria-label="Payment method">
              {card && config.methods.cardFields ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === 'card'}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    method === 'card'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                  onClick={() => onMethodChange('card')}
                  disabled={disabled}
                >
                  Card
                </button>
              ) : null}
              {paypal && config.methods.paypalButton ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={method === 'paypal'}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    method === 'paypal'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                  onClick={() => onMethodChange('paypal')}
                  disabled={disabled}
                >
                  PayPal
                </button>
              ) : null}
            </div>

            {method === 'card' && card && config.methods.cardFields ? (
              <CardPaymentFields
                amountValue={amountValue}
                onValidityChange={onCardValidityChange}
                submitRef={cardSubmitRef}
              />
            ) : null}

            {method === 'paypal' && config.methods.paypalButton ? (
              <PaypalWalletButton ensurePaypalOrder={ensurePaypalOrder} disabled={disabled} />
            ) : null}
          </div>
        )}
      </EligibilityGate>
    </PayPalProvider>
  );
}

export type { CardSubmitResult };
