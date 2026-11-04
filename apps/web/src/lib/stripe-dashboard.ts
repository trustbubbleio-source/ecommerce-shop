/** Deep-link a Checkout Session into the Stripe Dashboard (test vs live). */
export function stripeCheckoutSessionUrl(sessionId: string): string | null {
  if (!sessionId || sessionId.startsWith('cs_mock_')) return null;
  const test = sessionId.includes('_test_');
  const base = test ? 'https://dashboard.stripe.com/test' : 'https://dashboard.stripe.com';
  return `${base}/checkout/sessions/${sessionId}`;
}
