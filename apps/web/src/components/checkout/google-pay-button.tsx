import { ApiError, api } from '@akknerds/api-client';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadGooglePaySdk } from '../../lib/google-pay-sdk';
import {
  useGooglePayOneTimePaymentSession,
  type UseGooglePayOneTimePaymentSessionProps,
} from '../../lib/paypal';
import { useCheckoutStore } from '../../store/checkout';

export type GooglePayConfig = UseGooglePayOneTimePaymentSessionProps['googlePayConfig'];

interface GooglePayButtonProps {
  ensureGooglePayOrder: () => Promise<{ orderId: string; paypalOrderId: string }>;
  googlePayConfig: GooglePayConfig;
  amountValue: string;
  environment: 'sandbox' | 'live';
  disabled?: boolean;
}

/**
 * Custom express-strip Google Pay control (matches Apple Pay slot styling).
 * Payment flow still runs through PayPal's Google Pay session + Google pay.js.
 */
export function GooglePayButton({
  ensureGooglePayOrder,
  googlePayConfig,
  amountValue,
  environment,
  disabled,
}: GooglePayButtonProps) {
  const navigate = useNavigate();
  const clear = useCheckoutStore((s) => s.clear);
  const setError = useCheckoutStore((s) => s.setError);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadGooglePaySdk()
      .then(() => {
        if (!cancelled) setSdkReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setSdkReady(false);
          setError('Google Pay could not load. Use card or PayPal instead.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [setError]);

  if (!sdkReady) {
    return <GooglePayFace disabled />;
  }

  return (
    <GooglePaySessionButton
      ensureGooglePayOrder={ensureGooglePayOrder}
      googlePayConfig={googlePayConfig}
      amountValue={amountValue}
      environment={environment}
      disabled={disabled}
      clear={clear}
      setError={setError}
      navigate={navigate}
    />
  );
}

function GooglePaySessionButton({
  ensureGooglePayOrder,
  googlePayConfig,
  amountValue,
  environment,
  disabled,
  clear,
  setError,
  navigate,
}: GooglePayButtonProps & {
  clear: () => void;
  setError: (message: string | null) => void;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { isPending, handleClick, error } = useGooglePayOneTimePaymentSession({
    googlePayConfig,
    environment: environment === 'live' ? 'PRODUCTION' : 'TEST',
    transactionInfo: {
      countryCode: 'SE',
      currencyCode: 'SEK',
      totalPriceStatus: 'FINAL',
      totalPrice: amountValue,
    },
    createOrder: async () => {
      const session = await ensureGooglePayOrder();
      return { orderId: session.paypalOrderId };
    },
    onApprove: async (data) => {
      const orderId = useCheckoutStore.getState().orderId;
      const paypalOrderId =
        (data as { orderId?: string })?.orderId ?? useCheckoutStore.getState().paypalOrderId;
      if (!orderId || !paypalOrderId) {
        setError('Missing payment session after Google Pay approval.');
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
      setError('Google Pay checkout was cancelled. You can try again.');
    },
    onError: () => {
      setError('Google Pay failed to start. Use card or PayPal instead.');
    },
  });

  useEffect(() => {
    if (error) {
      // Session setup errors (e.g. missing component) — keep the face visible but unusable.
      console.warn('[google-pay]', error.message);
    }
  }, [error]);

  return (
    <GooglePayFace
      disabled={disabled || isPending || Boolean(error)}
      onClick={() => {
        void handleClick();
      }}
    />
  );
}

function GooglePayFace({
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
      aria-label="Pay with Google Pay"
      className="flex h-11 w-full items-center justify-center rounded-lg bg-black text-white transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="inline-flex items-center gap-1.5">
        <GoogleGLogo />
        <span className="text-[15px] font-medium tracking-tight text-white">Pay</span>
      </span>
    </button>
  );
}

/** Standard four-color Google "G" mark. */
function GoogleGLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
