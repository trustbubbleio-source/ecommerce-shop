import type { Order } from '@akknerds/shared';
import Stripe from 'stripe';
import type { Env } from '../env.js';

export interface StripeInvoiceDocument {
  url: string;
  label: 'Invoice.pdf' | 'Receipt';
}

type StripeInvoiceLike = { invoice_pdf?: string | null };

type StripeChargeLike = { receipt_url?: string | null };

type StripePaymentIntentLike = {
  latest_charge?: string | StripeChargeLike | null;
};

export interface StripeCheckoutSessionLike {
  id: string;
  url?: string | null;
  invoice?: string | StripeInvoiceLike | null;
  payment_intent?: string | StripePaymentIntentLike | null;
}

/** The minimal slice of the Stripe SDK the app relies on (keeps tests injectable). */
export interface StripeLike {
  checkout: {
    sessions: {
      create(
        params: Stripe.Checkout.SessionCreateParams,
      ): Promise<{ id: string; url: string | null }>;
      retrieve?(
        id: string,
        params?: { expand?: string[] },
      ): Promise<StripeCheckoutSessionLike>;
    };
  };
  invoices?: {
    retrieve(id: string): Promise<StripeInvoiceLike>;
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

function invoicePdfUrl(invoice: string | StripeInvoiceLike | null | undefined): string | null {
  if (!invoice || typeof invoice === 'string') return null;
  return invoice.invoice_pdf || null;
}

function receiptUrl(
  paymentIntent: string | StripePaymentIntentLike | null | undefined,
): string | null {
  if (!paymentIntent || typeof paymentIntent === 'string') return null;
  const charge = paymentIntent.latest_charge;
  if (!charge || typeof charge === 'string') return null;
  return charge.receipt_url || null;
}

function documentFromSession(session: StripeCheckoutSessionLike): StripeInvoiceDocument | null {
  const pdf = invoicePdfUrl(session.invoice);
  if (pdf) return { url: pdf, label: 'Invoice.pdf' };
  const receipt = receiptUrl(session.payment_intent);
  if (receipt) return { url: receipt, label: 'Receipt' };
  return null;
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
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `One More Rip order ${order.id}`,
          metadata: { orderId: order.id },
          footer: 'One More Rip · Hallandsvägen 21, 269 36 Båstad, Sweden',
        },
      },
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL');
    }
    return { sessionId: session.id, url: session.url };
  }

  /**
   * Prefers the Stripe invoice PDF; falls back to the hosted payment receipt
   * for older Checkout sessions created without invoice_creation.
   */
  async resolveInvoiceDocument(
    sessionId: string,
    session?: StripeCheckoutSessionLike,
  ): Promise<StripeInvoiceDocument | null> {
    if (!this.client || sessionId.startsWith('cs_mock_')) return null;

    const fromEvent = session ? documentFromSession(session) : null;
    if (fromEvent?.label === 'Invoice.pdf') return fromEvent;

    if (typeof session?.invoice === 'string' && this.client.invoices?.retrieve) {
      const invoice = await this.client.invoices.retrieve(session.invoice);
      const pdf = invoicePdfUrl(invoice);
      if (pdf) return { url: pdf, label: 'Invoice.pdf' };
    }

    const retrieved = await this.client.checkout.sessions.retrieve?.(sessionId, {
      expand: ['invoice', 'payment_intent.latest_charge'],
    });
    if (retrieved) {
      const fromRetrieve = documentFromSession(retrieved);
      if (fromRetrieve) return fromRetrieve;
      if (typeof retrieved.invoice === 'string' && this.client.invoices?.retrieve) {
        const invoice = await this.client.invoices.retrieve(retrieved.invoice);
        const pdf = invoicePdfUrl(invoice);
        if (pdf) return { url: pdf, label: 'Invoice.pdf' };
      }
    }

    return fromEvent;
  }

  constructEvent(payload: string, signature: string): { type: string; data: { object: unknown } } {
    if (!this.client) {
      throw new Error('Stripe is not configured');
    }
    return this.client.webhooks.constructEvent(payload, signature, this.env.stripeWebhookSecret);
  }
}
