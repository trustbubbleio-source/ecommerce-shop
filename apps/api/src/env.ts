/** Environment configuration, parsed once and shared across the app. */
export interface Env {
  port: number;
  webOrigins: string[];
  jwtSecret: string;
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  checkoutSuccessUrl: string;
  checkoutCancelUrl: string;
  /** Whether a real Stripe key is configured; otherwise checkout runs in mock mode. */
  stripeEnabled: boolean;
}

const PLACEHOLDERS = new Set(['', 'sk_test_xxx', 'sk_live_xxx', 'whsec_xxx']);

function isReal(value: string | undefined): value is string {
  return typeof value === 'string' && !PLACEHOLDERS.has(value);
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const stripeSecretKey = source.STRIPE_SECRET_KEY ?? '';
  return {
    port: Number.parseInt(source.PORT ?? '4000', 10),
    webOrigins: (source.WEB_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    jwtSecret: source.JWT_SECRET ?? 'dev-super-secret-change-me-in-production',
    stripeSecretKey,
    stripeWebhookSecret: source.STRIPE_WEBHOOK_SECRET ?? '',
    checkoutSuccessUrl: source.CHECKOUT_SUCCESS_URL ?? 'http://localhost:5173/checkout/success',
    checkoutCancelUrl: source.CHECKOUT_CANCEL_URL ?? 'http://localhost:5173/cart',
    stripeEnabled: isReal(stripeSecretKey) && stripeSecretKey.startsWith('sk_'),
  };
}
