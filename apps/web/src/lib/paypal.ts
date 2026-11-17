/**
 * Single import point for the PayPal React SDK v6 wrapper.
 * Tests mock this module so the real SDK never loads in jsdom.
 */
export {
  PayPalProvider,
  PayPalCardFieldsProvider,
  PayPalCardNameField,
  PayPalCardNumberField,
  PayPalCardExpiryField,
  PayPalCardCvvField,
  PayPalOneTimePaymentButton,
  useGooglePayOneTimePaymentSession,
  usePayPalCardFieldsOneTimePaymentSession,
  useEligibleMethods,
  usePayPal,
} from '@paypal/react-paypal-js/sdk-v6';

export type { UseGooglePayOneTimePaymentSessionProps } from '@paypal/react-paypal-js/sdk-v6';

export type CardSubmitState = 'succeeded' | 'canceled' | 'failed';

export interface CardSubmitResult {
  state: CardSubmitState;
  orderId?: string;
  liabilityShift?: string;
  message?: string;
}
