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
  /** Whether DATABASE_URL is configured for Postgres via Prisma. */
  databaseEnabled: boolean;
  /** AWS S3 + CloudFront for asset storage (server-side uploads). */
  storage: StorageEnv;
}

export interface StorageEnv {
  enabled: boolean;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  cloudfrontUrl: string;
}

const PLACEHOLDERS = new Set(['', 'sk_test_xxx', 'sk_live_xxx', 'whsec_xxx']);

function isReal(value: string | undefined): value is string {
  return typeof value === 'string' && !PLACEHOLDERS.has(value);
}

function isDatabaseConfigured(source: NodeJS.ProcessEnv): boolean {
  const url = source.DATABASE_URL?.trim();
  return Boolean(url && url.startsWith('postgresql://'));
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const stripeSecretKey = source.STRIPE_SECRET_KEY ?? '';
  const cloudfrontUrl = (source.AWS_CLOUDFRONT_URL ?? '').replace(/\/$/, '');
  const accessKeyId = source.AWS_ACCESS_KEY_ID ?? '';
  const secretAccessKey = source.AWS_SECRET_ACCESS_KEY ?? '';
  const region = source.AWS_REGION ?? '';
  const bucket = source.AWS_BUCKET ?? '';
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
    databaseEnabled: isDatabaseConfigured(source),
    storage: {
      enabled: Boolean(accessKeyId && secretAccessKey && region && bucket),
      accessKeyId,
      secretAccessKey,
      region,
      bucket,
      cloudfrontUrl,
    },
  };
}
