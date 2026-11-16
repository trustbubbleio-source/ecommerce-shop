import type { CheckoutConfig } from '@akknerds/shared';
import { Alert, Spinner } from '@akknerds/ui';
import { useEffect, useMemo, useState, type MutableRefObject, type ReactNode } from 'react';
import {
  PayPalProvider,
  useEligibleMethods,
  type CardSubmitResult,
} from '../../lib/paypal';
import { CardPaymentFields, type CardSubmitFn } from './card-payment-fields';
import { ExpressCheckout } from './express-checkout';

export type PaymentUiMethod = 'card' | 'paypal';

interface PaymentSectionProps {
  config: CheckoutConfig;
  amountOre: number;
  method: PaymentUiMethod;
  onMethodChange: (method: PaymentUiMethod) => void;
  onCardValidityChange: (valid: boolean) => void;
  /** Fired once when the SDK cannot offer card/wallet UI — parent should fall back to redirect. */
  onUnavailable?: () => void;
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
      countryCode: 'SE',
    } as never,
  });

  // PayPal's eligibility service can hard-fail (ERR_INIT_FIND_ELIGIBLE_METHODS) even when
  // card-fields / paypal-payments sessions create successfully. In that case keep offering UI.
  const eligibilityBroken = Boolean(error);
  const card =
    eligibilityBroken ||
    Boolean(
      (eligiblePaymentMethods as { isEligible?: (method: string) => boolean } | null)?.isEligible?.(
        'advanced_cards',
      ),
    );
  const paypal =
    eligibilityBroken ||
    Boolean(
      (eligiblePaymentMethods as { isEligible?: (method: string) => boolean } | null)?.isEligible?.(
        'paypal',
      ),
    );

  useEffect(() => {
    if (isLoading || eligibilityBroken) return;
    if (!card && !paypal) onIneligible();
  }, [isLoading, eligibilityBroken, card, paypal, onIneligible]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner label="Loading payment methods" />
      </div>
    );
  }

  if (!eligibilityBroken && !card && !paypal) {
    return (
      <Alert variant="info">
        Card fields could not load. You can still pay with PayPal below.
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
  onUnavailable,
  cardSubmitRef,
  ensurePaypalOrder,
  disabled,
}: PaymentSectionProps) {
  const [sdkIneligible, setSdkIneligible] = useState(false);
  const amountValue = useMemo(() => (amountOre / 100).toFixed(2), [amountOre]);

  const markUnavailable = () => {
    setSdkIneligible((already) => {
      if (!already) onUnavailable?.();
      return true;
    });
  };

  if (sdkIneligible) {
    return (
      <Alert variant="info">
        Card fields could not load. You can still pay with PayPal below.
      </Alert>
    );
  }

  return (
    <PayPalProvider
      clientId={config.clientId}
      environment={config.environment === 'live' ? 'production' : 'sandbox'}
      components={['card-fields', 'paypal-payments']}
      pageType="checkout"
      locale={config.locale}
    >
      <EligibilityGate onIneligible={markUnavailable}>
        {({ card, paypal }) => (
          <EligibleMethods
            card={card}
            paypal={paypal}
            config={config}
            method={method}
            onMethodChange={onMethodChange}
            amountValue={amountValue}
            onCardValidityChange={onCardValidityChange}
            cardSubmitRef={cardSubmitRef}
            ensurePaypalOrder={ensurePaypalOrder}
            disabled={disabled}
          />
        )}
      </EligibilityGate>
    </PayPalProvider>
  );
}

function EligibleMethods({
  card,
  paypal,
  config,
  method,
  onMethodChange,
  amountValue,
  onCardValidityChange,
  cardSubmitRef,
  ensurePaypalOrder,
  disabled,
}: {
  card: boolean;
  paypal: boolean;
  config: CheckoutConfig;
  method: PaymentUiMethod;
  onMethodChange: (method: PaymentUiMethod) => void;
  amountValue: string;
  onCardValidityChange: (valid: boolean) => void;
  cardSubmitRef: MutableRefObject<CardSubmitFn | null>;
  ensurePaypalOrder: () => Promise<{ orderId: string; paypalOrderId: string }>;
  disabled?: boolean;
}) {
  const showCard = card && config.methods.cardFields;
  const showPaypal = paypal && config.methods.paypalButton;

  useEffect(() => {
    if (method === 'card' && !showCard && showPaypal) onMethodChange('paypal');
    if (method === 'paypal' && showCard) onMethodChange('card');
  }, [method, showCard, showPaypal, onMethodChange]);

  return (
    <div className="flex flex-col gap-6">
      <ExpressCheckout
        ensurePaypalOrder={ensurePaypalOrder}
        showPaypal={showPaypal}
        disabled={disabled}
      />

      {showPaypal && showCard ? (
        <div className="relative flex items-center gap-3" role="separator" aria-label="Or">
          <div className="border-border h-px flex-1 border-t" />
          <span className="text-muted-foreground text-xs font-medium">Or pay with card</span>
          <div className="border-border h-px flex-1 border-t" />
        </div>
      ) : null}

      {showCard ? (
        <CardPaymentFields
          amountValue={amountValue}
          onValidityChange={onCardValidityChange}
          submitRef={cardSubmitRef}
        />
      ) : null}
    </div>
  );
}

export type { CardSubmitResult };
