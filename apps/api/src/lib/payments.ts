import type { Order } from '@akknerds/shared';
import Stripe from 'stripe';
import type { Env } from '../env.js';

/** The minimal slice of the Stripe SDK the app relies on (keeps tests injectable). */
export interface StripeLike {
  checkout: {
    sessions: {
      create(
        params: Stripe.Checkout.SessionCreateParams,
      ): Promise<{ id: string; url: string | null }>;
    };
  };
  webhooks: {
    constructEvent(
      payload: string | Buffer,
      signature: string,
      secret: string,
    ): { type: string; data: { object: unknown } };
  };
}

export interface CheckoutResult {
  sessionId: string;
  url: string;
}

/**
 * Wraps Stripe Checkout. When no real key is configured the service runs in
 * "mock" mode and returns a local success URL, so the whole purchase flow works
 * end-to-end in development without Stripe credentials.
 */
export class PaymentService {
  private readonly client?: StripeLike;

  constructor(
    private readonly env: Env,
    client?: StripeLike,
  ) {
    if (client) {
      this.client = client;
    } else if (env.stripeEnabled) {
      this.client = new Stripe(env.stripeSecretKey) as unknown as StripeLike;
    }
  }

  get enabled(): boolean {
    return Boolean(this.client);
  }

  async createCheckout(order: Order): Promise<CheckoutResult> {
    if (!this.client) {
      return {
        sessionId: `cs_mock_${order.id}`,
        url: `${this.env.checkoutSuccessUrl}?order_id=${order.id}&mock=1`,
      };
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.lines.map((line) => ({
      quantity: line.quantity,
      price_data: {
        currency: order.currency,
        unit_amount: line.unitPrice,
        product_data: { name: line.name },
      },
    }));

    if (order.shipping > 0) {
      lineItems.push({
        quantity: 1,
        price_data: {
          currency: order.currency,
          unit_amount: order.shipping,
          product_data: { name: 'Shipping' },
        },
      });
    }

    const session = await this.client.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      customer_email: order.email,
      success_url: `${this.env.checkoutSuccessUrl}?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: this.env.checkoutCancelUrl,
      metadata: { orderId: order.id },
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL');
    }
    return { sessionId: session.id, url: session.url };
  }

  constructEvent(payload: string, signature: string): { type: string; data: { object: unknown } } {
    if (!this.client) {
      throw new Error('Stripe is not configured');
    }
    return this.client.webhooks.constructEvent(payload, signature, this.env.stripeWebhookSecret);
  }
}
