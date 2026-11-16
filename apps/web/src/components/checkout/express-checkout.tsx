import type { ReactNode } from 'react';
import { PaypalWalletButton } from './paypal-wallet-button';

interface ExpressCheckoutProps {
  ensurePaypalOrder: () => Promise<{ orderId: string; paypalOrderId: string }>;
  showPaypal: boolean;
  disabled?: boolean;
}

/**
 * Express checkout strip — Apple/Google Pay shown as branded slots (enabled after
 * domain association + PayPal wallet eligibility). PayPal is live today.
 */
export function ExpressCheckout({
  ensurePaypalOrder,
  showPaypal,
  disabled,
}: ExpressCheckoutProps) {
  if (!showPaypal) return null;

  return (
    <div className="border-border bg-muted/40 flex flex-col gap-4 rounded-xl border p-4 sm:p-5">
      <p className="text-foreground text-center text-sm font-semibold tracking-tight">
        Express checkout
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
        <ExpressSlot
          label="Apple Pay"
          title="Apple Pay needs domain verification in PayPal / Apple before it can go live."
          disabled
        >
          <ApplePayMark />
        </ExpressSlot>

        <ExpressSlot
          label="Google Pay"
          title="Google Pay will appear here once PayPal wallet eligibility is confirmed for this domain."
          disabled
        >
          <GooglePayMark />
        </ExpressSlot>

        <div
          className={`bg-[#ffc439] flex min-h-11 items-center justify-center overflow-hidden rounded-lg ${
            disabled ? 'pointer-events-none opacity-50' : ''
          }`}
        >
          <div className="w-full scale-[0.92] px-1 [&_iframe]:!min-h-10">
            <PaypalWalletButton ensurePaypalOrder={ensurePaypalOrder} disabled={disabled} />
          </div>
        </div>
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
      className="bg-foreground text-background flex min-h-11 cursor-not-allowed items-center justify-center rounded-lg opacity-80"
    >
      {children}
      <span className="sr-only">{label}</span>
    </button>
  );
}

function ApplePayMark() {
  return (
    <svg width="52" height="20" viewBox="0 0 52 20" aria-hidden="true">
      <path
        fill="currentColor"
        d="M9.2 4.2c-.5.6-.8 1.4-.7 2.2.8.1 1.7-.4 2.2-1 .5-.6.8-1.4.7-2.2-.8 0-1.6.4-2.2 1zM11.4 6.7c-1.2 0-2.2.7-2.8.7-.6 0-1.5-.7-2.5-.7-1.3 0-2.4.7-3.1 1.9-1.3 2.3-.3 5.7 1 7.6.6.9 1.4 1.9 2.4 1.9 1 0 1.3-.6 2.5-.6s1.5.6 2.5.6 1.7-.9 2.3-1.8c.7-1 1-2 1-2.1-.1 0-1.8-.7-1.8-2.7 0-1.7 1.4-2.5 1.4-2.5-.8-1.2-2-1.3-2.4-1.3z"
      />
      <text
        x="20"
        y="14.5"
        fill="currentColor"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="12"
        fontWeight="600"
      >
        Pay
      </text>
    </svg>
  );
}

function GooglePayMark() {
  return (
    <svg width="56" height="20" viewBox="0 0 56 20" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M14.5 9.4v1.9h3.3c-.1.8-.3 1.4-.7 1.9-.5.6-1.3 1.3-2.6 1.3-2.1 0-3.8-1.7-3.8-3.8s1.7-3.8 3.8-3.8c1.1 0 1.9.4 2.5 1l1.4-1.4C17.5 5.6 16.2 5 14.5 5 11.1 5 8.4 7.7 8.4 11.1s2.7 6.1 6.1 6.1c1.8 0 3.1-.6 4.2-1.7 1.1-1.1 1.4-2.6 1.4-3.8 0-.4 0-.7-.1-1H14.5z"
      />
      <path
        fill="#34A853"
        d="M6.7 12.5c0-.5.1-1 .2-1.4H3.2v2.7h2.1c-.1.6-.5 1.3-1.1 1.7v1.4h2.1c1.2-1.1 2-2.8 2-4.4z"
        transform="translate(5.2 -1.4) scale(.55)"
      />
      <text
        x="22"
        y="14.5"
        fill="currentColor"
        fontFamily="system-ui, sans-serif"
        fontSize="12"
        fontWeight="600"
      >
        Pay
      </text>
    </svg>
  );
}
