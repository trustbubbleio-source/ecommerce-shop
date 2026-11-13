import type { Order } from '@akknerds/shared';
import type { Env } from '../env.js';

export interface CheckoutResult {
  sessionId: string;
  url: string;
}

/** Cents discounted off subtotal+shipping (matches `priceCart` ledger). */
export function orderDiscountCents(order: Pick<Order, 'subtotal' | 'shipping' | 'total'>): number {
  return Math.max(0, order.subtotal + order.shipping - order.total);
}

function oreToPayPalAmount(ore: number): string {
  return (ore / 100).toFixed(2);
}

interface PayPalLink {
  href: string;
  rel: string;
  method?: string;
}

interface PayPalOrderResponse {
  id: string;
  status?: string;
  links?: PayPalLink[];
}

interface PayPalCaptureResponse {
  id: string;
  status?: string;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{ id?: string; status?: string }>;
    };
  }>;
}

/**
 * PayPal Orders v2 Checkout. Without client credentials the service runs in
 * mock mode (local success URL) so local/dev still works end-to-end.
 */
export class PaymentService {
  private accessToken?: string;
  private accessTokenExpiresAt = 0;

  constructor(private readonly env: Env) {}

  get enabled(): boolean {
    return this.env.paypalEnabled;
  }

  private apiBase(): string {
    return this.env.paypalMode === 'live'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
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

    const res = await fetch(`${this.apiBase()}/v1/oauth2/token`, {
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

  private async paypalFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.apiBase()}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`PayPal ${init?.method ?? 'GET'} ${path} failed (${res.status}): ${body.slice(0, 400)}`);
    }
    return (await res.json()) as T;
  }

  async createCheckout(order: Order): Promise<CheckoutResult> {
    if (!this.enabled) {
      return {
        sessionId: `PAYPAL_MOCK_${order.id}`,
        url: `${this.env.checkoutSuccessUrl}?order_id=${order.id}&mock=1`,
      };
    }

    // Deterministic stub for API tests — never hits the network.
    if (this.env.paypalClientId === 'test_paypal_client') {
      return {
        sessionId: `PAYPAL_TEST_${order.id}`,
        url: `https://www.sandbox.paypal.com/checkoutnow?token=PAYPAL_TEST_${order.id}`,
      };
    }

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

    const amountValue = oreToPayPalAmount(order.total);
    const breakdown: Record<string, { currency_code: string; value: string }> = {
      item_total: { currency_code: currency, value: oreToPayPalAmount(itemTotal) },
    };
    if (order.shipping > 0) {
      breakdown.shipping = { currency_code: currency, value: oreToPayPalAmount(order.shipping) };
    }
    if (discountCents > 0) {
      breakdown.discount = { currency_code: currency, value: oreToPayPalAmount(discountCents) };
    }

    const payload = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: order.id,
          custom_id: order.id,
          description: `One More Rip order ${order.id}`.slice(0, 127),
          amount: {
            currency_code: currency,
            value: amountValue,
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
                    country_code: (order.shippingAddress.country || 'SE').slice(0, 2).toUpperCase(),
                  },
                },
              }
            : {}),
        },
      ],
      application_context: {
        brand_name: 'One More Rip',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
        shipping_preference: order.shippingAddress ? 'SET_PROVIDED_ADDRESS' : 'NO_SHIPPING',
        return_url: `${this.env.checkoutSuccessUrl}?order_id=${encodeURIComponent(order.id)}`,
        cancel_url: `${this.env.checkoutCancelUrl}?order_id=${encodeURIComponent(order.id)}`,
      },
    };

    const created = await this.paypalFetch<PayPalOrderResponse>('/v2/checkout/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const approve = created.links?.find((l) => l.rel === 'approve' || l.rel === 'payer-action');
    if (!created.id || !approve?.href) {
      throw new Error('PayPal did not return an approve URL');
    }

    return { sessionId: created.id, url: approve.href };
  }

  /**
   * Capture an approved PayPal order. Idempotent enough for success-page retries:
   * already-captured orders are treated as success.
   */
  async captureOrder(paypalOrderId: string): Promise<{ captured: boolean; status: string }> {
    if (!this.enabled || paypalOrderId.startsWith('PAYPAL_MOCK_')) {
      return { captured: true, status: 'COMPLETED' };
    }

    try {
      const captured = await this.paypalFetch<PayPalCaptureResponse>(
        `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
        { method: 'POST', body: '{}' },
      );
      const status =
        captured.status ??
        captured.purchase_units?.[0]?.payments?.captures?.[0]?.status ??
        'UNKNOWN';
      return { captured: status === 'COMPLETED', status };
    } catch (error) {
      // Already captured / order not approvable — inspect current state.
      const existing = await this.paypalFetch<PayPalOrderResponse>(
        `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`,
      );
      if (existing.status === 'COMPLETED') {
        return { captured: true, status: 'COMPLETED' };
      }
      throw error;
    }
  }

  async refundOrder(order: Order): Promise<{ refunded: boolean }> {
    const sessionId = order.paymentSessionId;
    if (!this.enabled || !sessionId || sessionId.startsWith('PAYPAL_MOCK_')) {
      return { refunded: false };
    }

    const details = await this.paypalFetch<PayPalCaptureResponse>(
      `/v2/checkout/orders/${encodeURIComponent(sessionId)}`,
    );
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
