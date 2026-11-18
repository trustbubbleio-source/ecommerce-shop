import { ApiError, api } from '@akknerds/api-client';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SITE } from '../../config/site';
import { canMakeApplePayPayments, loadApplePaySdk } from '../../lib/apple-pay-sdk';
import {
  useApplePayOneTimePaymentSession,
  type UseApplePayOneTimePaymentSessionProps,
} from '../../lib/paypal';
import { useCheckoutStore } from '../../store/checkout';

export type ApplePayConfig = UseApplePayOneTimePaymentSessionProps['applePayConfig'];

interface ApplePayButtonProps {
  ensureApplePayOrder: () => Promise<{ orderId: string; paypalOrderId: string }>;
  applePayConfig: ApplePayConfig;
  amountValue: string;
  disabled?: boolean;
}

/**
 * Custom express-strip Apple Pay control (matches Google Pay slot styling).
 * Payment flow runs through PayPal's Apple Pay session + Apple Pay JS.
 */
export function ApplePayButton({
  ensureApplePayOrder,
  applePayConfig,
  amountValue,
  disabled,
}: ApplePayButtonProps) {
  const navigate = useNavigate();
  const clear = useCheckoutStore((s) => s.clear);
  const setError = useCheckoutStore((s) => s.setError);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadApplePaySdk()
      .then(() => {
        if (!cancelled) setSdkReady(canMakeApplePayPayments());
      })
      .catch(() => {
        if (!cancelled) {
          setSdkReady(false);
          setError('Apple Pay could not load. Use card or PayPal instead.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [setError]);

  if (!sdkReady) {
    return <ApplePayFace disabled />;
  }

  return (
    <ApplePaySessionButton
      ensureApplePayOrder={ensureApplePayOrder}
      applePayConfig={applePayConfig}
      amountValue={amountValue}
      disabled={disabled}
      clear={clear}
      setError={setError}
      navigate={navigate}
    />
  );
}

function ApplePaySessionButton({
  ensureApplePayOrder,
  applePayConfig,
  amountValue,
  disabled,
  clear,
  setError,
  navigate,
}: ApplePayButtonProps & {
  clear: () => void;
  setError: (message: string | null) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { isPending, handleClick, error } = useApplePayOneTimePaymentSession({
    applePayConfig,
    applePaySessionVersion: 4,
    displayName: SITE.name,
    paymentRequest: {
      countryCode: 'SE',
      currencyCode: 'SEK',
      requiredBillingContactFields: ['postalAddress'],
      requiredShippingContactFields: [],
      total: {
        label: SITE.name,
        amount: amountValue,
        type: 'final',
      },
    },
    createOrder: async () => {
      const session = await ensureApplePayOrder();
      return { orderId: session.paypalOrderId };
    },
    onApprove: async (data) => {
      const orderId = useCheckoutStore.getState().orderId;
      const paypalOrderId =
        (data as { orderId?: string })?.orderId ?? useCheckoutStore.getState().paypalOrderId;
      if (!orderId || !paypalOrderId) {
        setError('Missing payment session after Apple Pay approval.');
        return;
      }
      try {
        await api.capturePayment(orderId, { paypalOrderId });
        clear();
        navigate(`/checkout/success?order_id=${encodeURIComponent(orderId)}`);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Payment capture failed.');
      }
    },
    onCancel: () => {
      setError('Apple Pay checkout was cancelled. You can try again.');
    },
    onError: () => {
      setError('Apple Pay failed to start. Use card or PayPal instead.');
    },
  });

  useEffect(() => {
    if (error) {
      console.warn('[apple-pay]', error.message);
    }
  }, [error]);

  return (
    <ApplePayFace
      disabled={disabled || isPending || Boolean(error)}
      onClick={() => {
        void handleClick();
      }}
    />
  );
}

function ApplePayFace({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label="Pay with Apple Pay"
      className="flex h-11 w-full items-center justify-center rounded-lg bg-black text-white transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="inline-flex items-center gap-1.5">
        <AppleLogo />
        <span className="text-[15px] font-medium tracking-tight text-white">Pay</span>
      </span>
    </button>
  );
}

function AppleLogo() {
  return (
    <svg width="16" height="20" viewBox="0 0 384 512" aria-hidden="true" className="fill-white">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-68.1 35.1-17.9 20.9-28.3 46.9-25.4 74.5 26.9 2.1 52.2-13.5 69.5-37.1z" />
    </svg>
  );
}
