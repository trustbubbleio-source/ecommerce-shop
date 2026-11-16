import { toShippingCountryIso, type Order, type PaymentMethod } from '@akknerds/shared';
import type { Env } from '../env.js';

export interface CheckoutResult {
  sessionId: string;
  /** Present for redirect / mock; null for on-site card/wallet. */
  url: string | null;
}

export type CaptureOutcome =
  | { outcome: 'completed'; status: string; captureId?: string }
  | { outcome: 'pending'; status: string; captureId?: string }
  | { outcome: 'declined'; status: string; responseCode?: string };

export class PayPalApiError extends Error {
  readonly status: number;
  readonly nameCode?: string;
  readonly issue?: string;
  readonly debugId?: string;

  constructor(opts: {
    message: string;
    status: number;
    nameCode?: string;
    issue?: string;
    debugId?: string;
  }) {
    super(opts.message);
    this.name = 'PayPalApiError';
    this.status = opts.status;
    this.nameCode = opts.nameCode;
    this.issue = opts.issue;
    this.debugId = opts.debugId;
  }
}

export interface PayPalAuthenticationResult {
  liability_shift?: 'POSSIBLE' | 'NO' | 'UNKNOWN' | string;
  three_d_secure?: {
    enrollment_status?: string;
    authentication_status?: string;
  };
}

export interface PayPalOrderDetails {
  id: string;
  status?: string;
  links?: Array<{ href: string; rel: string; method?: string }>;
  purchase_units?: Array<{
    custom_id?: string;
    amount?: { currency_code?: string; value?: string };
    payments?: {
      captures?: Array<{
        id?: string;
        status?: string;
        processor_response?: { response_code?: string };
      }>;
    };
  }>;
  payment_source?: {
    card?: {
      authentication_result?: PayPalAuthenticationResult;
    };
  };
}

/** Cents discounted off subtotal+shipping (matches `priceCart` ledger). */
export function orderDiscountCents(order: Pick<Order, 'subtotal' | 'shipping' | 'total'>): number {
  return Math.max(0, order.subtotal + order.shipping - order.total);
}

function oreToPayPalAmount(ore: number): string {
  return (ore / 100).toFixed(2);
}

export function paypalAmountToOre(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return NaN;
  return Math.round(parsed * 100);
}

/**
 * Server-side 3DS policy from PayPal's response-parameter table.
 * Returns true when capture is allowed.
 */
export function evaluate3dsPolicy(
  auth: PayPalAuthenticationResult | undefined,
): { ok: true } | { ok: false; reason: string } {
  if (!auth) {
    return { ok: true };
  }

  const shift = (auth.liability_shift ?? '').toUpperCase();
  const enrollment = (auth.three_d_secure?.enrollment_status ?? '').toUpperCase();
  const authentication = (auth.three_d_secure?.authentication_status ?? '').toUpperCase();

  if (shift === 'POSSIBLE' && enrollment === 'Y' && (authentication === 'Y' || authentication === 'A')) {
    return { ok: true };
  }

  if (shift === 'NO' && (enrollment === 'N' || enrollment === 'U' || enrollment === 'B')) {
    return { ok: true };
  }

  if (
    shift === 'NO' &&
    enrollment === 'Y' &&
    (authentication === 'N' || authentication === 'R' || authentication === 'U' || !authentication)
  ) {
    return { ok: false, reason: 'Card authentication failed. Try again or use another card.' };
  }

  if (shift === 'UNKNOWN') {
    return { ok: false, reason: 'Could not verify card authentication. Please try again.' };
  }

  // Absent liability shift with partial auth data: allow and log upstream.
  if (!shift) {
    return { ok: true };
  }

  return { ok: false, reason: 'Card authentication did not meet our security requirements.' };
}

function captureStatusFromResponse(body: PayPalOrderDetails): {
  status: string;
  captureId?: string;
  responseCode?: string;
} {
  const capture = body.purchase_units?.[0]?.payments?.captures?.[0];
  // Prefer capture status — order COMPLETED with capture DECLINED must not look paid.
  const status = capture?.status ?? body.status ?? 'UNKNOWN';
  return {
    status,
    captureId: capture?.id,
    responseCode: capture?.processor_response?.response_code,
  };
}

function toCaptureOutcome(body: PayPalOrderDetails): CaptureOutcome {
  const { status, captureId, responseCode } = captureStatusFromResponse(body);
  const upper = status.toUpperCase();
  if (upper === 'COMPLETED') {
    return { outcome: 'completed', status, captureId };
  }
  if (upper === 'PENDING') {
    return { outcome: 'pending', status, captureId };
  }
  return { outcome: 'declined', status, responseCode };
}

/**
 * PayPal Orders v2 Checkout. Without client credentials the service runs in
 * mock mode (local success URL) so local/dev still works end-to-end.
 */
export class PaymentService {
  private accessToken?: string;
  private accessTokenExpiresAt = 0;
  private attemptCounters = new Map<string, number>();
  /** Test-only: override network for webhook / order stubs. */
  fetchImpl: typeof fetch = fetch;

  constructor(private readonly env: Env) {}

  get enabled(): boolean {
    return this.env.paypalEnabled;
  }

  private apiBase(): string {
    return this.env.paypalMode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  private nextAttempt(orderId: string, method: PaymentMethod): number {
    const key = `${orderId}:${method}`;
    const next = (this.attemptCounters.get(key) ?? 0) + 1;
    this.attemptCounters.set(key, next);
    return next;
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.accessTokenExpiresAt - 30_000) {
      return this.accessToken;
    }

    const auth = Buffer.from(
      `${this.env.paypalClientId}:${this.env.paypalClientSecret}`,
      'utf8',
    ).toString('base64');

    const res = await this.fetchImpl(`${this.apiBase()}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`PayPal OAuth failed (${res.status}): ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.accessTokenExpiresAt = now + data.expires_in * 1000;
    return this.accessToken;
  }

  private async paypalFetch<T>(
    path: string,
    init?: RequestInit & { requestId?: string },
  ): Promise<T> {
    const token = await this.getAccessToken();
    const { requestId, ...rest } = init ?? {};
    const res = await this.fetchImpl(`${this.apiBase()}${path}`, {
      ...rest,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(requestId ? { 'PayPal-Request-Id': requestId } : {}),
        ...(rest.headers ?? {}),
      },
    });
    if (!res.ok) {
      const bodyText = await res.text();
      let nameCode: string | undefined;
      let issue: string | undefined;
      let debugId: string | undefined;
      try {
        const parsed = JSON.parse(bodyText) as {
          name?: string;
          debug_id?: string;
          details?: Array<{ issue?: string }>;
        };
        nameCode = parsed.name;
        issue = parsed.details?.[0]?.issue;
        debugId = parsed.debug_id;
      } catch {
        // keep raw body in message
      }
      if (debugId) {
        console.error('[paypal] API error debug_id=', debugId, nameCode, issue);
      }
      throw new PayPalApiError({
        message: `PayPal ${rest.method ?? 'GET'} ${path} failed (${res.status}): ${bodyText.slice(0, 400)}`,
        status: res.status,
        nameCode,
        issue,
        debugId,
      });
    }
    return (await res.json()) as T;
  }

  buildPurchaseUnit(order: Order) {
    const discountCents = orderDiscountCents(order);
    const itemTotal = order.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const currency = 'SEK';

    const items = order.lines.map((line) => ({
      name: line.name.slice(0, 127),
      quantity: String(line.quantity),
      unit_amount: {
        currency_code: currency,
        value: oreToPayPalAmount(line.unitPrice),
      },
      category: 'PHYSICAL_GOODS' as const,
      sku: line.productId.slice(0, 127),
    }));

    const breakdown: Record<string, { currency_code: string; value: string }> = {
      item_total: { currency_code: currency, value: oreToPayPalAmount(itemTotal) },
    };
    if (order.shipping > 0) {
      breakdown.shipping = { currency_code: currency, value: oreToPayPalAmount(order.shipping) };
    }
    if (discountCents > 0) {
      breakdown.discount = { currency_code: currency, value: oreToPayPalAmount(discountCents) };
    }

    const shippingCountry = toShippingCountryIso(order.shippingAddress?.country);

    return {
      reference_id: order.id,
      custom_id: order.id,
      description: `One More Rip order ${order.id}`.slice(0, 127),
      amount: {
        currency_code: currency,
        value: oreToPayPalAmount(order.total),
        breakdown,
      },
      items,
      ...(order.shippingAddress
        ? {
            shipping: {
              name: { full_name: order.shippingAddress.fullName.slice(0, 300) },
              address: {
                address_line_1: order.shippingAddress.line1.slice(0, 300),
                ...(order.shippingAddress.line2
                  ? { address_line_2: order.shippingAddress.line2.slice(0, 300) }
                  : {}),
                admin_area_2: order.shippingAddress.city.slice(0, 120),
                postal_code: order.shippingAddress.postalCode.slice(0, 60),
                country_code: shippingCountry,
              },
            },
          }
        : {}),
    };
  }

  private buildPaymentSource(order: Order, method: PaymentMethod) {
    const orderId = encodeURIComponent(order.id);
    const returnUrl = `${this.env.checkoutSuccessUrl}?order_id=${orderId}`;
    const cancelUrl = `${this.env.checkoutCancelUrl}?order_id=${orderId}`;

    if (method === 'card') {
      return {
        card: {
          attributes: {
            verification: { method: this.env.paypalScaMethod },
          },
          experience_context: {
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        },
      };
    }

    if (method === 'swish') {
      // PayPal Swish expects Name object (given_name / surname), not a plain string.
      const parts = (order.shippingAddress?.fullName ?? '').trim().split(/\s+/).filter(Boolean);
      const givenName = (parts[0] ?? 'Customer').slice(0, 140);
      const surname = (parts.length > 1 ? parts.slice(1).join(' ') : givenName).slice(0, 140);
      return {
        swish: {
          name: {
            given_name: givenName,
            surname,
          },
          country_code: 'SE',
          experience_context: {
            locale: 'sv-SE',
            return_url: returnUrl,
            cancel_url: cancelUrl,
          },
        },
      };
    }

    const shippingCountry = toShippingCountryIso(order.shippingAddress?.country);
    const nameParts = (order.shippingAddress?.fullName ?? '').trim().split(/\s+/).filter(Boolean);
    const givenName = nameParts[0] ?? undefined;
    const surname = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

    return {
      paypal: {
        ...(order.email ? { email_address: order.email.slice(0, 254) } : {}),
        ...(givenName || surname
          ? {
              name: {
                ...(givenName ? { given_name: givenName.slice(0, 140) } : {}),
                ...(surname ? { surname: surname.slice(0, 140) } : {}),
              },
            }
          : {}),
        address: {
          country_code: shippingCountry,
        },
        experience_context: {
          brand_name: 'One More Rip',
          locale: 'sv-SE',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          shipping_preference: order.shippingAddress ? 'SET_PROVIDED_ADDRESS' : 'NO_SHIPPING',
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      },
    };
  }

  async createCheckout(
    order: Order,
    options: { method?: PaymentMethod } = {},
  ): Promise<CheckoutResult> {
    const method = options.method ?? 'redirect';

    if (!this.enabled) {
      return {
        sessionId: `PAYPAL_MOCK_${order.id}`,
        url: `${this.env.checkoutSuccessUrl}?order_id=${order.id}&mock=1`,
      };
    }

    // Deterministic stub for API tests — never hits the network.
    if (this.env.paypalClientId === 'test_paypal_client') {
      const sessionId = `PAYPAL_TEST_${order.id}_${method}_${this.nextAttempt(order.id, method)}`;
      if (method === 'redirect' || method === 'swish') {
        return {
          sessionId,
          url: `https://www.sandbox.paypal.com/checkoutnow?token=${sessionId}`,
        };
      }
      return { sessionId, url: null };
    }

    const payload: Record<string, unknown> = {
      intent: 'CAPTURE',
      purchase_units: [this.buildPurchaseUnit(order)],
      payment_source: this.buildPaymentSource(order, method),
    };
    // Swish auto-captures on approval so return_url + webhook can settle without a second click.
    if (method === 'swish') {
      payload.processing_instruction = 'ORDER_COMPLETE_ON_PAYMENT_APPROVAL';
    }

    const attempt = this.nextAttempt(order.id, method);
    const created = await this.paypalFetch<PayPalOrderDetails>('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
      requestId: `${order.id}:${method}:${attempt}`,
    });

    if (!created.id) {
      throw new Error('PayPal did not return an order id');
    }

    if (method === 'redirect' || method === 'swish') {
      const approve = created.links?.find((l) => l.rel === 'approve' || l.rel === 'payer-action');
      if (!approve?.href) {
        throw new Error('PayPal did not return an approve URL');
      }
      return { sessionId: created.id, url: approve.href };
    }

    return { sessionId: created.id, url: null };
  }

  async getOrder(paypalOrderId: string): Promise<PayPalOrderDetails> {
    if (!this.enabled || paypalOrderId.startsWith('PAYPAL_MOCK_')) {
      return {
        id: paypalOrderId,
        status: 'COMPLETED',
        purchase_units: [
          {
            custom_id: paypalOrderId.replace(/^PAYPAL_MOCK_/, ''),
            // Omit amount so settle guards skip the mock mismatch check.
            payments: { captures: [{ id: `cap_${paypalOrderId}`, status: 'COMPLETED' }] },
          },
        ],
      };
    }

    if (this.env.paypalClientId === 'test_paypal_client') {
      // Default stub: created but not captured. Tests override via fetchImpl / subclass.
      return {
        id: paypalOrderId,
        status: 'CREATED',
        purchase_units: [
          {
            custom_id: paypalOrderId.includes('ord_')
              ? paypalOrderId.split('_').slice(2, 4).join('_') || undefined
              : undefined,
            amount: { currency_code: 'SEK', value: '169.00' },
          },
        ],
      };
    }

    return this.paypalFetch<PayPalOrderDetails>(
      `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`,
    );
  }

  /**
   * Capture an approved PayPal order. Decision is based on the **capture**
   * status, not the order status (declined cards can leave order COMPLETED).
   */
  async captureOrder(paypalOrderId: string): Promise<CaptureOutcome> {
    if (!this.enabled || paypalOrderId.startsWith('PAYPAL_MOCK_')) {
      return { outcome: 'completed', status: 'COMPLETED', captureId: `cap_${paypalOrderId}` };
    }

    if (this.env.paypalClientId === 'test_paypal_client') {
      return { outcome: 'completed', status: 'COMPLETED', captureId: `cap_${paypalOrderId}` };
    }

    try {
      const captured = await this.paypalFetch<PayPalOrderDetails>(
        `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
        {
          method: 'POST',
          body: '{}',
          requestId: `capture-${paypalOrderId}`,
        },
      );
      return toCaptureOutcome(captured);
    } catch (error) {
      if (error instanceof PayPalApiError && (error.status === 422 || error.issue === 'INSTRUMENT_DECLINED')) {
        return {
          outcome: 'declined',
          status: error.issue ?? 'DECLINED',
          responseCode: error.issue,
        };
      }
      // Already captured / order not approvable — inspect current state.
      const existing = await this.getOrder(paypalOrderId);
      const fromExisting = toCaptureOutcome(existing);
      if (fromExisting.outcome === 'completed') {
        return fromExisting;
      }
      throw error;
    }
  }

  /**
   * Verify a PayPal webhook transmission.
   * Uses POST /v1/notifications/verify-webhook-signature when credentials exist.
   * In mock / test_paypal_client mode, accepts a transmission id of `valid`.
   */
  async verifyWebhook(
    headers: Record<string, string | undefined>,
    rawBody: string,
  ): Promise<boolean> {
    const transmissionId = headers['paypal-transmission-id'] ?? headers['PayPal-Transmission-Id'];
    const transmissionTime =
      headers['paypal-transmission-time'] ?? headers['PayPal-Transmission-Time'];
    const certUrl = headers['paypal-cert-url'] ?? headers['PayPal-Cert-Url'];
    const authAlgo = headers['paypal-auth-algo'] ?? headers['PayPal-Auth-Algo'];
    const transmissionSig =
      headers['paypal-transmission-sig'] ?? headers['PayPal-Transmission-Sig'];

    if (!this.enabled || this.env.paypalClientId === 'test_paypal_client') {
      return transmissionId === 'valid';
    }

    if (!this.env.paypalWebhookId) {
      console.error('[paypal] webhook rejected: PAYPAL_WEBHOOK_ID is not configured');
      return false;
    }

    if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
      return false;
    }

    void crc32Paypal; // available if we switch to self-verify against cert_url

    try {
      const result = await this.paypalFetch<{ verification_status?: string }>(
        '/v1/notifications/verify-webhook-signature',
        {
          method: 'POST',
          body: JSON.stringify({
            transmission_id: transmissionId,
            transmission_time: transmissionTime,
            cert_url: certUrl,
            auth_algo: authAlgo,
            transmission_sig: transmissionSig,
            webhook_id: this.env.paypalWebhookId,
            webhook_event: JSON.parse(rawBody),
          }),
        },
      );
      return result.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('[paypal] webhook verification failed', error);
      return false;
    }
  }

  async refundOrder(order: Order): Promise<{ refunded: boolean }> {
    const sessionId = order.paymentSessionId;
    if (!this.enabled || !sessionId || sessionId.startsWith('PAYPAL_MOCK_')) {
      return { refunded: false };
    }

    if (this.env.paypalClientId === 'test_paypal_client') {
      return { refunded: true };
    }

    const details = await this.getOrder(sessionId);
    const captureId = details.purchase_units?.[0]?.payments?.captures?.[0]?.id;
    if (!captureId) {
      throw new Error('No PayPal capture to refund');
    }

    await this.paypalFetch(`/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
      method: 'POST',
      body: JSON.stringify({
        amount: {
          currency_code: 'SEK',
          value: oreToPayPalAmount(order.total),
        },
        note_to_payer: `Refund for order ${order.id}`,
      }),
    });
    return { refunded: true };
  }
}

/** IEEE CRC32 used by PayPal webhook self-verify docs (kept for completeness). */
function crc32Paypal(input: string): number {
  let crc = 0xffffffff;
  for (let i = 0; i < input.length; i += 1) {
    crc ^= input.charCodeAt(i);
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
