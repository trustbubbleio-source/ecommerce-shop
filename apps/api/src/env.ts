/** Default JWT secret used only for local/dev — never acceptable in production. */
export const DEV_JWT_SECRET = 'dev-super-secret-change-me-in-production';

export type PaypalCardFieldsMode = 'off' | 'admin' | 'on';
export type PaypalScaMethod = 'SCA_ALWAYS' | 'SCA_WHEN_REQUIRED';

/** Environment configuration, parsed once and shared across the app. */
export interface Env {
  port: number;
  webOrigins: string[];
  jwtSecret: string;
  paypalClientId: string;
  paypalClientSecret: string;
  /** `sandbox` (default) or `live`. */
  paypalMode: 'sandbox' | 'live';
  /** Dashboard webhook id for signature verification. */
  paypalWebhookId: string;
  /** Kill switch / canary for on-site card fields. */
  paypalCardFields: PaypalCardFieldsMode;
  /** 3DS verification method sent on card Orders. */
  paypalScaMethod: PaypalScaMethod;
  /** Cancel stale pending online orders older than this many minutes. */
  pendingOrderTtlMinutes: number;
  checkoutSuccessUrl: string;
  checkoutCancelUrl: string;
  /**
   * Public web origin used for absolute links. Defaults to the first WEB_ORIGIN.
   */
  instoreCheckoutBaseUrl: string;
  /** Whether PayPal REST credentials are configured; otherwise checkout runs in mock mode. */
  paypalEnabled: boolean;
  /** Zettle developer portal client id (self-hosted app). */
  zettleClientId: string;
  /** Zettle API key JWT (assertion grant). */
  zettleApiKey: string;
  /** Optional cached STORE inventory UUID (skips discovery). */
  zettleStoreInventoryUuid?: string;
  /** Optional cached SOLD inventory UUID (skips discovery). */
  zettleSoldInventoryUuid?: string;
  /** Whether Zettle inventory sync is configured. */
  zettleEnabled: boolean;
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
  return typeof value === 'string' && !PLACEHOLDERS.has(value) && value.trim().length > 0;
}

function isDatabaseConfigured(source: NodeJS.ProcessEnv): boolean {
  const url = source.DATABASE_URL?.trim();
  return Boolean(url && url.startsWith('postgresql://'));
}

function truthyFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

function parseCardFieldsMode(value: string | undefined): PaypalCardFieldsMode {
  const normalized = (value ?? 'off').trim().toLowerCase();
  if (normalized === 'on' || normalized === 'admin' || normalized === 'off') return normalized;
  return 'off';
}

function parseScaMethod(value: string | undefined): PaypalScaMethod {
  const normalized = (value ?? 'SCA_ALWAYS').trim().toUpperCase();
  if (normalized === 'SCA_WHEN_REQUIRED') return 'SCA_WHEN_REQUIRED';
  return 'SCA_ALWAYS';
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
  if (!env.paypalEnabled && !env.allowMockPayments) {
    problems.push(
      'PAYPAL_API_KEY + PAYPAL_SECRET_KEY must be set, or set ALLOW_MOCK_PAYMENTS=true explicitly (prelaunch only).',
    );
  }
  if (env.paypalEnabled && env.paypalMode !== 'live') {
    problems.push(
      'PAYPAL_MODE must be "live" in production (unset defaults to sandbox and breaks live credentials).',
    );
  }
  if (env.paypalEnabled && !env.paypalWebhookId) {
    problems.push(
      'PAYPAL_WEBHOOK_ID must be set in production so PayPal webhook signatures can be verified.',
    );
  }
  if (
    env.paypalEnabled &&
    (/localhost|127\.0\.0\.1/i.test(env.checkoutSuccessUrl) ||
      /localhost|127\.0\.0\.1/i.test(env.checkoutCancelUrl))
  ) {
    problems.push(
      'CHECKOUT_SUCCESS_URL / CHECKOUT_CANCEL_URL must be public https URLs in production (not localhost).',
    );
  }
  // Zettle is strongly recommended in production for POS↔web stock sync, but
  // do not hard-fail boot — local stock still works until keys are added.
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
  const paypalClientId = (source.PAYPAL_API_KEY ?? source.PAYPAL_CLIENT_ID ?? '').trim();
  const paypalClientSecret = (source.PAYPAL_SECRET_KEY ?? source.PAYPAL_CLIENT_SECRET ?? '').trim();
  const modeRaw = (source.PAYPAL_MODE ?? '').trim().toLowerCase();
  const paypalMode: 'sandbox' | 'live' =
    modeRaw === 'live' || modeRaw === 'production' ? 'live' : 'sandbox';
  const zettleClientId = (source.ZETTLE_CLIENT_ID ?? '').trim();
  const zettleApiKey = (source.ZETTLE_API_KEY ?? '').trim();
  const zettleStoreInventoryUuid = source.ZETTLE_STORE_INVENTORY_UUID?.trim() || undefined;
  const zettleSoldInventoryUuid = source.ZETTLE_SOLD_INVENTORY_UUID?.trim() || undefined;
  const cloudfrontUrl = (source.AWS_CLOUDFRONT_URL ?? '').replace(/\/$/, '');
  const accessKeyId = source.AWS_ACCESS_KEY_ID ?? '';
  const secretAccessKey = source.AWS_SECRET_ACCESS_KEY ?? '';
  const region = source.AWS_REGION ?? '';
  const bucket = source.AWS_BUCKET ?? '';
  const resendApiKey = source.RESEND_API_KEY ?? '';
  const googleClientId = source.GOOGLE_CLIENT_ID ?? '';
  const webOrigins = (source.WEB_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const instoreCheckoutBaseUrl = (
    source.INSTORE_CHECKOUT_BASE_URL ??
    webOrigins[0] ??
    'http://localhost:5173'
  ).replace(/\/$/, '');
  const ttlRaw = Number.parseInt(source.PENDING_ORDER_TTL_MINUTES ?? '30', 10);
  return {
    port: Number.parseInt(source.PORT ?? '4000', 10),
    webOrigins,
    jwtSecret: source.JWT_SECRET ?? DEV_JWT_SECRET,
    paypalClientId,
    paypalClientSecret,
    paypalMode,
    paypalWebhookId: (source.PAYPAL_WEBHOOK_ID ?? '').trim(),
    paypalCardFields: parseCardFieldsMode(source.PAYPAL_CARD_FIELDS),
    paypalScaMethod: parseScaMethod(source.PAYPAL_SCA_METHOD),
    pendingOrderTtlMinutes: Number.isFinite(ttlRaw) && ttlRaw > 0 ? ttlRaw : 30,
    checkoutSuccessUrl: source.CHECKOUT_SUCCESS_URL ?? 'http://localhost:5173/checkout/success',
    checkoutCancelUrl: source.CHECKOUT_CANCEL_URL ?? 'http://localhost:5173/cart',
    instoreCheckoutBaseUrl,
    paypalEnabled: isReal(paypalClientId) && isReal(paypalClientSecret),
    zettleClientId,
    zettleApiKey,
    zettleStoreInventoryUuid,
    zettleSoldInventoryUuid,
    zettleEnabled: isReal(zettleClientId) && isReal(zettleApiKey),
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
