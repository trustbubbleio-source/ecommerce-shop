import { ApiError, api } from '@akknerds/api-client';
import type { ComponentProps } from 'react';
import { useNavigate } from 'react-router-dom';
import { GooglePayOneTimePaymentButton } from '../../lib/paypal';
import { useCheckoutStore } from '../../store/checkout';

export type GooglePayConfig = ComponentProps<
  typeof GooglePayOneTimePaymentButton
>['googlePayConfig'];

interface GooglePayButtonProps {
  ensureGooglePayOrder: () => Promise<{ orderId: string; paypalOrderId: string }>;
  googlePayConfig: GooglePayConfig;
  amountValue: string;
  environment: 'sandbox' | 'live';
  disabled?: boolean;
}

/**
 * Native Google Pay button via PayPal JS SDK v6. Confirms the PayPal order with
 * Google payment data, then captures through our existing checkout endpoint.
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

  return (
    <div
      className={`flex h-full w-full items-center justify-center overflow-hidden rounded-lg ${
        disabled ? 'pointer-events-none opacity-50' : ''
      }`}
    >
      <GooglePayOneTimePaymentButton
        googlePayConfig={googlePayConfig}
        environment={environment === 'live' ? 'PRODUCTION' : 'TEST'}
        buttonColor="black"
        buttonType="pay"
        buttonSizeMode="fill"
        transactionInfo={{
          countryCode: 'SE',
          currencyCode: 'SEK',
          totalPriceStatus: 'FINAL',
          totalPrice: amountValue,
        }}
        createOrder={async () => {
          const session = await ensureGooglePayOrder();
          return { orderId: session.paypalOrderId };
        }}
        onApprove={async (data) => {
          const orderId = useCheckoutStore.getState().orderId;
          const paypalOrderId =
            (data as { orderId?: string })?.orderId ??
            useCheckoutStore.getState().paypalOrderId;
          if (!orderId || !paypalOrderId) {
            setError('Missing payment session after Google Pay approval.');
            return;
          }
          try {
            await api.capturePayment(orderId, { paypalOrderId });
            clear();
            navigate(`/checkout/success?order_id=${encodeURIComponent(orderId)}`);
          } catch (error) {
            setError(error instanceof ApiError ? error.message : 'Payment capture failed.');
          }
        }}
        onCancel={() => {
          setError('Google Pay checkout was cancelled. You can try again.');
        }}
        onError={() => {
          setError('Google Pay failed to start. Use card or PayPal instead.');
        }}
      />
    </div>
  );
}
