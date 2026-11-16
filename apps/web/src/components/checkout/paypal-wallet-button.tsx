import { ApiError, api } from '@akknerds/api-client';
import { useNavigate } from 'react-router-dom';
import { PayPalOneTimePaymentButton } from '../../lib/paypal';
import { useCheckoutStore } from '../../store/checkout';

interface PaypalWalletButtonProps {
  ensurePaypalOrder: () => Promise<{ orderId: string; paypalOrderId: string }>;
  disabled?: boolean;
}

/**
 * v6 PayPal wallet button (popup/modal). Falls back to redirect when the popup is blocked
 * via the SDK presentationMode "auto" default.
 */
export function PaypalWalletButton({ ensurePaypalOrder, disabled }: PaypalWalletButtonProps) {
  const navigate = useNavigate();
  const clear = useCheckoutStore((s) => s.clear);
  const setError = useCheckoutStore((s) => s.setError);

  return (
    <div className={disabled ? 'pointer-events-none opacity-50' : undefined}>
      <PayPalOneTimePaymentButton
        presentationMode="auto"
        createOrder={async () => {
          const session = await ensurePaypalOrder();
          return { orderId: session.paypalOrderId };
        }}
        onApprove={async (data) => {
          const orderId = useCheckoutStore.getState().orderId;
          const paypalOrderId =
            (data as { orderId?: string })?.orderId ??
            useCheckoutStore.getState().paypalOrderId;
          if (!orderId || !paypalOrderId) {
            setError('Missing payment session after PayPal approval.');
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
          setError('PayPal checkout was cancelled. You can try again.');
        }}
        onError={() => {
          setError('PayPal wallet failed to start. Use card or Pay with PayPal instead.');
        }}
      />
    </div>
  );
}
