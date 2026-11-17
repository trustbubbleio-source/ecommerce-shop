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
import type { GooglePayConfig } from './google-pay-button';

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
  ensureGooglePayOrder?: () => Promise<{ orderId: string; paypalOrderId: string }>;
  onSwishPay?: () => Promise<void>;
  disabled?: boolean;
}

type EligibleSnapshot = {
  card: boolean;
  paypal: boolean;
  googlePay: boolean;
  googlePayConfig: GooglePayConfig | null;
};

function EligibilityGate({
  children,
  onIneligible,
}: {
  children: (eligible: EligibleSnapshot) => ReactNode;
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
  const methods = eligiblePaymentMethods as {
    isEligible?: (method: string) => boolean;
    getDetails?: (method: string) => { config?: GooglePayConfig } | undefined;
  } | null;

  const card =
    eligibilityBroken || Boolean(methods?.isEligible?.('advanced_cards'));
  const paypal = eligibilityBroken || Boolean(methods?.isEligible?.('paypal'));
  const googlePayEligible = Boolean(methods?.isEligible?.('googlepay'));
  const googlePayConfig =
    googlePayEligible && methods?.getDetails
      ? (methods.getDetails('googlepay')?.config ?? null)
      : null;
  // Prefer hide until ready-to-pay config exists (do not show live button on eligibilityBroken alone).
  const googlePay = Boolean(googlePayConfig);

  useEffect(() => {
    if (isLoading || eligibilityBroken) return;
    if (!card && !paypal && !googlePay) onIneligible();
  }, [isLoading, eligibilityBroken, card, paypal, googlePay, onIneligible]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner label="Loading payment methods" />
      </div>
    );
  }

  if (!eligibilityBroken && !card && !paypal && !googlePay) {
    return (
      <Alert variant="info">
        Card fields could not load. You can still pay with PayPal below.
      </Alert>
    );
  }

  return <>{children({ card, paypal, googlePay, googlePayConfig })}</>;
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
  ensureGooglePayOrder,
  onSwishPay,
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
      components={['card-fields', 'paypal-payments', 'googlepay-payments']}
      pageType="checkout"
      locale={config.locale}
    >
      <EligibilityGate onIneligible={markUnavailable}>
        {({ card, paypal, googlePay, googlePayConfig }) => (
          <EligibleMethods
            card={card}
            paypal={paypal}
            googlePay={googlePay}
            googlePayConfig={googlePayConfig}
            config={config}
            method={method}
            onMethodChange={onMethodChange}
            amountValue={amountValue}
            onCardValidityChange={onCardValidityChange}
            cardSubmitRef={cardSubmitRef}
            ensurePaypalOrder={ensurePaypalOrder}
            ensureGooglePayOrder={ensureGooglePayOrder}
            onSwishPay={onSwishPay}
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
  googlePay,
  googlePayConfig,
  config,
  method,
  onMethodChange,
  amountValue,
  onCardValidityChange,
  cardSubmitRef,
  ensurePaypalOrder,
  ensureGooglePayOrder,
  onSwishPay,
  disabled,
}: {
  card: boolean;
  paypal: boolean;
  googlePay: boolean;
  googlePayConfig: GooglePayConfig | null;
  config: CheckoutConfig;
  method: PaymentUiMethod;
  onMethodChange: (method: PaymentUiMethod) => void;
  amountValue: string;
  onCardValidityChange: (valid: boolean) => void;
  cardSubmitRef: MutableRefObject<CardSubmitFn | null>;
  ensurePaypalOrder: () => Promise<{ orderId: string; paypalOrderId: string }>;
  ensureGooglePayOrder?: () => Promise<{ orderId: string; paypalOrderId: string }>;
  onSwishPay?: () => Promise<void>;
  disabled?: boolean;
}) {
  const showCard = card && config.methods.cardFields;
  const showPaypal = paypal && config.methods.paypalButton;
  const showGooglePay = googlePay && config.methods.googlePayButton;
  const showSwish = Boolean(config.methods.swishButton && onSwishPay);

  useEffect(() => {
    if (method === 'card' && !showCard && showPaypal) onMethodChange('paypal');
    if (method === 'paypal' && showCard) onMethodChange('card');
  }, [method, showCard, showPaypal, onMethodChange]);

  return (
    <div className="flex flex-col gap-6">
      <ExpressCheckout
        ensurePaypalOrder={ensurePaypalOrder}
        ensureGooglePayOrder={ensureGooglePayOrder}
        onSwishPay={onSwishPay}
        showPaypal={showPaypal}
        showGooglePay={showGooglePay}
        googlePayConfig={googlePayConfig}
        amountValue={amountValue}
        environment={config.environment}
        showSwish={showSwish}
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
