/** Default JWT secret used only for local/dev — never acceptable in production. */
export const DEV_JWT_SECRET = 'dev-super-secret-change-me-in-production';

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
  /** Explicit opt-in to mock payments in production (prelaunch / emergency only). */
  allowMockPayments: boolean;
  /** Whether DATABASE_URL is configured for Postgres via Prisma. */
  databaseEnabled: boolean;
  /** AWS S3 + CloudFront for asset storage (server-side uploads). */
  storage: StorageEnv;
  /** Resend transactional email. */
  email: EmailEnv;
  /** Google Identity Services (Sign in with Google). */
  google: GoogleAuthEnv;
}

export interface StorageEnv {
  enabled: boolean;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  cloudfrontUrl: string;
}

export interface EmailEnv {
  enabled: boolean;
  apiKey: string;
  /** Default From header, e.g. `One More Rip <noreply@onemorerip.cards>`. */
  from: string;
  /** Inbox that receives contact-form submissions. */
  contactInbox: string;
  /** Inbox that receives paid-order packing alerts. */
  ordersInbox: string;
}

export interface GoogleAuthEnv {
  enabled: boolean;
  clientId: string;
}

const PLACEHOLDERS = new Set([
  '',
  'sk_test_xxx',
  'sk_live_xxx',
  'whsec_xxx',
  're_xxx',
  'google_client_id_xxx',
]);

function isReal(value: string | undefined): value is string {
  return typeof value === 'string' && !PLACEHOLDERS.has(value);
}

function isDatabaseConfigured(source: NodeJS.ProcessEnv): boolean {
  const url = source.DATABASE_URL?.trim();
  return Boolean(url && url.startsWith('postgresql://'));
}

function isStripeSecret(value: string): boolean {
  // Secret keys (sk_) or restricted keys (rk_) from the Stripe Dashboard.
  return isReal(value) && (value.startsWith('sk_') || value.startsWith('rk_'));
}

function truthyFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

/** True on Railway / NODE_ENV=production — local vitest and `pnpm dev` stay lenient. */
export function isProductionRuntime(source: NodeJS.ProcessEnv = process.env): boolean {
  if (source.NODE_ENV === 'test') return false;
  return (
    source.NODE_ENV === 'production' ||
    Boolean(source.RAILWAY_ENVIRONMENT) ||
    Boolean(source.RAILWAY_ENVIRONMENT_NAME)
  );
}

/**
 * Refuse to boot a misconfigured production API (silent mock/memory/default JWT).
 * Call from `server.ts` only — unit tests keep using `loadEnv` without this gate.
 */
export function assertProductionEnv(env: Env, source: NodeJS.ProcessEnv = process.env): void {
  if (!isProductionRuntime(source)) return;

  const problems: string[] = [];

  if (!env.databaseEnabled) {
    problems.push('DATABASE_URL must be a postgresql:// URL (in-memory repos are not allowed).');
  }
  if (!env.jwtSecret || env.jwtSecret === DEV_JWT_SECRET || env.jwtSecret.length < 32) {
    problems.push('JWT_SECRET must be set to a strong random value (32+ chars), not the dev default.');
  }
  if (!env.stripeEnabled && !env.allowMockPayments) {
    problems.push(
      'STRIPE_SECRET_KEY must be a real sk_/rk_ key, or set ALLOW_MOCK_PAYMENTS=true explicitly (prelaunch only).',
    );
  }
  if (env.stripeEnabled && !isReal(env.stripeWebhookSecret)) {
    problems.push('STRIPE_WEBHOOK_SECRET (whsec_...) is required when Stripe is enabled.');
  }
  if (!env.email.enabled) {
    problems.push('RESEND_API_KEY must be a real re_ key (mock email is not allowed in production).');
  }

  if (problems.length > 0) {
    throw new Error(
      `Production environment is not safe to start:\n- ${problems.join('\n- ')}`,
    );
  }
}

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const stripeSecretKey = source.STRIPE_SECRET_KEY ?? '';
  const cloudfrontUrl = (source.AWS_CLOUDFRONT_URL ?? '').replace(/\/$/, '');
  const accessKeyId = source.AWS_ACCESS_KEY_ID ?? '';
  const secretAccessKey = source.AWS_SECRET_ACCESS_KEY ?? '';
  const region = source.AWS_REGION ?? '';
  const bucket = source.AWS_BUCKET ?? '';
  const resendApiKey = source.RESEND_API_KEY ?? '';
  const googleClientId = source.GOOGLE_CLIENT_ID ?? '';
  return {
    port: Number.parseInt(source.PORT ?? '4000', 10),
    webOrigins: (source.WEB_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    jwtSecret: source.JWT_SECRET ?? DEV_JWT_SECRET,
    stripeSecretKey,
    stripeWebhookSecret: source.STRIPE_WEBHOOK_SECRET ?? '',
    checkoutSuccessUrl: source.CHECKOUT_SUCCESS_URL ?? 'http://localhost:5173/checkout/success',
    checkoutCancelUrl: source.CHECKOUT_CANCEL_URL ?? 'http://localhost:5173/cart',
    stripeEnabled: isStripeSecret(stripeSecretKey),
    allowMockPayments: truthyFlag(source.ALLOW_MOCK_PAYMENTS),
    databaseEnabled: isDatabaseConfigured(source),
    storage: {
      enabled: Boolean(accessKeyId && secretAccessKey && region && bucket),
      accessKeyId,
      secretAccessKey,
      region,
      bucket,
      cloudfrontUrl,
    },
    email: {
      enabled: isReal(resendApiKey) && resendApiKey.startsWith('re_'),
      apiKey: resendApiKey,
      from: source.EMAIL_FROM ?? 'One More Rip <onboarding@resend.dev>',
      contactInbox: source.EMAIL_CONTACT_INBOX ?? 'contact@onemorerip.cards',
      ordersInbox: source.EMAIL_ORDERS_INBOX ?? 'order@onemorerip.cards',
    },
    google: {
      enabled: isReal(googleClientId),
      clientId: googleClientId,
    },
  };
}
