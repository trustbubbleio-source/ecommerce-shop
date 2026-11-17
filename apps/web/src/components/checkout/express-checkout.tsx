import type { ReactNode } from 'react';
import { GooglePayButton, type GooglePayConfig } from './google-pay-button';
import { PaypalWalletButton } from './paypal-wallet-button';

interface ExpressCheckoutProps {
  ensurePaypalOrder: () => Promise<{ orderId: string; paypalOrderId: string }>;
  ensureGooglePayOrder?: () => Promise<{ orderId: string; paypalOrderId: string }>;
  /** Starts Swish via PayPal (creates order + redirects to payer-action). */
  onSwishPay?: () => Promise<void>;
  showPaypal: boolean;
  showGooglePay?: boolean;
  googlePayConfig?: GooglePayConfig | null;
  amountValue?: string;
  environment?: 'sandbox' | 'live';
  showSwish?: boolean;
  disabled?: boolean;
}

/**
 * Express checkout strip — Apple Pay stays a stub until domain association.
 * Google Pay, PayPal, and Swish are live when their config/eligibility flags say so.
 */
export function ExpressCheckout({
  ensurePaypalOrder,
  ensureGooglePayOrder,
  onSwishPay,
  showPaypal,
  showGooglePay,
  googlePayConfig,
  amountValue,
  environment = 'live',
  showSwish,
  disabled,
}: ExpressCheckoutProps) {
  if (!showPaypal && !showGooglePay && !showSwish) return null;

  const googlePayReady =
    Boolean(showGooglePay && ensureGooglePayOrder && googlePayConfig && amountValue);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-foreground text-center text-sm font-semibold tracking-tight">
        Express checkout
      </p>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <ExpressSlot
          label="Apple Pay"
          title="Apple Pay needs domain verification in PayPal / Apple before it can go live."
          disabled
        >
          <span className="inline-flex items-center gap-1.5">
            <AppleLogo />
            <span className="text-[15px] font-medium tracking-tight text-white">Pay</span>
          </span>
        </ExpressSlot>

        {googlePayReady ? (
          <GooglePayButton
            ensureGooglePayOrder={ensureGooglePayOrder!}
            googlePayConfig={googlePayConfig!}
            amountValue={amountValue!}
            environment={environment}
            disabled={disabled}
          />
        ) : (
          <ExpressSlot
            label="Google Pay"
            title="Google Pay will appear here once PayPal wallet eligibility is confirmed for this domain."
            disabled
          >
            <span className="inline-flex items-center gap-1.5">
              <GoogleGLogo />
              <span className="text-[15px] font-medium tracking-tight text-white">Pay</span>
            </span>
          </ExpressSlot>
        )}

        {showPaypal ? (
          <div
            className={`bg-[#ffc439] flex h-11 items-center justify-center overflow-hidden rounded-lg ${
              disabled ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            <div className="flex h-full w-full items-center justify-center [&_iframe]:!h-11 [&_iframe]:!max-h-11">
              <PaypalWalletButton ensurePaypalOrder={ensurePaypalOrder} disabled={disabled} />
            </div>
          </div>
        ) : (
          <ExpressSlot label="PayPal" title="PayPal wallet is not enabled." disabled>
            <span className="text-[15px] font-semibold tracking-tight text-white">PayPal</span>
          </ExpressSlot>
        )}

        {showSwish && onSwishPay ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => void onSwishPay()}
            aria-label="Pay with Swish"
            className="flex min-h-11 items-center justify-center rounded-lg bg-[#ee2a7b] px-3 text-white transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SwishWordmark />
          </button>
        ) : (
          <ExpressSlot
            label="Swish"
            title="Swish needs PayPal Business onboarding before it can go live."
            disabled
          >
            <SwishWordmark />
          </ExpressSlot>
        )}
      </div>
    </div>
  );
}

function ExpressSlot({
  children,
  label,
  title,
  disabled,
}: {
  children: ReactNode;
  label: string;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      aria-label={`${label} (coming soon)`}
      className="flex min-h-11 cursor-not-allowed items-center justify-center rounded-lg bg-black text-white opacity-90"
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function SwishWordmark() {
  return (
    <span className="text-[15px] font-bold tracking-tight text-white" aria-hidden>
      Swish
    </span>
  );
}

function AppleLogo() {
  return (
    <svg width="16" height="20" viewBox="0 0 384 512" aria-hidden="true" className="fill-white">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-68.1 35.1-17.9 20.9-28.3 46.9-25.4 74.5 26.9 2.1 52.2-13.5 69.5-37.1z" />
    </svg>
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
