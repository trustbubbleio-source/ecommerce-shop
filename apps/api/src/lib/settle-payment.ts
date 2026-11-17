import type { Order } from '@akknerds/shared';
import type { AppDeps } from '../context.js';
import {
  cancelOrderAndReleaseStock,
  reserveStockSynced,
  stockLinesFromOrder,
} from './inventory.js';
import { notifyPaidOrder } from './order-alert.js';
import {
  evaluate3dsPolicy,
  paypalAmountToOre,
  type CaptureOutcome,
  type PayPalOrderDetails,
} from './payments.js';
import { clearWelcomeDiscountAfterPurchase } from './welcome-discount.js';

export type SettleCaptureResult =
  | { kind: 'paid'; order: Order; newlyPaid: boolean }
  | { kind: 'pending'; code: 'PENDING_REVIEW' }
  | { kind: 'declined'; retryable: true; status: string }
  | { kind: 'sca_failed'; reason: string }
  | { kind: 'mismatch'; code: 'ORDER_MISMATCH'; message: string }
  | { kind: 'conflict'; status: number; message: string; refunded?: boolean };

async function markPaidAndNotify(
  deps: AppDeps,
  sessionId: string,
): Promise<{ order: Order; newlyPaid: boolean } | undefined> {
  const newlyPaid = await deps.orders.markPaidBySession(sessionId);
  if (newlyPaid) {
    await clearWelcomeDiscountAfterPurchase(deps, newlyPaid.userId);
    await notifyPaidOrder(deps.email, deps.env, newlyPaid);
    return { order: newlyPaid, newlyPaid: true };
  }
  const existing = await deps.orders.getByPaymentSession(sessionId);
  if (existing && (existing.status === 'paid' || existing.status === 'fulfilled')) {
    return { order: existing, newlyPaid: false };
  }
  return undefined;
}

/**
 * After a successful capture, if the local order was cancelled meanwhile,
 * try to re-reserve stock; otherwise refund.
 */
async function handleCaptureAfterCancel(
  deps: AppDeps,
  order: Order,
  sessionId: string,
): Promise<SettleCaptureResult> {
  const reserved = await reserveStockSynced(deps, stockLinesFromOrder(order));
  if (reserved.ok) {
    // Reactivate by setting paid via a fresh attach (session still linked).
    const revived = await deps.orders.setStatus(order.id, 'paid');
    if (revived) {
      await clearWelcomeDiscountAfterPurchase(deps, revived.userId);
      await notifyPaidOrder(deps.email, deps.env, revived);
      return { kind: 'paid', order: revived, newlyPaid: true };
    }
  }

  try {
    await deps.payments.refundOrder({ ...order, paymentSessionId: sessionId, status: 'cancelled' });
  } catch (error) {
    console.error('[checkout] refund after cancelled-order capture failed', error);
  }
  return {
    kind: 'conflict',
    status: 409,
    message: 'Payment captured but the order was cancelled; a refund was attempted.',
    refunded: true,
  };
}

export function verifyPayPalOrderMatches(
  order: Order,
  details: PayPalOrderDetails,
): { ok: true } | { ok: false; message: string } {
  const unit = details.purchase_units?.[0];
  const customId = unit?.custom_id;
  if (customId && customId !== order.id) {
    return { ok: false, message: 'PayPal order custom_id does not match our order.' };
  }
  const currency = unit?.amount?.currency_code;
  if (currency && currency !== 'SEK') {
    return { ok: false, message: 'PayPal order currency mismatch.' };
  }
  const value = unit?.amount?.value;
  if (value) {
    const ore = paypalAmountToOre(value);
    if (!Number.isFinite(ore) || ore !== order.total) {
      return { ok: false, message: 'PayPal order amount does not match our order total.' };
    }
  }
  return { ok: true };
}

/**
 * Shared capture + settle path used by POST /checkout/:id/capture,
 * the redirect capture alias, CHECKOUT.ORDER.APPROVED webhook, and the cleanup job.
 */
export async function captureAndSettle(
  deps: AppDeps,
  order: Order,
  paypalOrderId: string,
  options: { skip3ds?: boolean } = {},
): Promise<SettleCaptureResult> {
  if (order.status === 'paid' || order.status === 'fulfilled') {
    return { kind: 'paid', order, newlyPaid: false };
  }

  if (order.status !== 'pending' && order.status !== 'cancelled') {
    return {
      kind: 'conflict',
      status: 409,
      message: `Order cannot be captured in status ${order.status}`,
    };
  }

  if (order.paymentSessionId && order.paymentSessionId !== paypalOrderId) {
    return {
      kind: 'mismatch',
      code: 'ORDER_MISMATCH',
      message: 'PayPal order id does not match this checkout session.',
    };
  }

  let details: PayPalOrderDetails;
  try {
    details = await deps.payments.getOrder(paypalOrderId);
  } catch (error) {
    console.error('[checkout] getOrder failed', error);
    return { kind: 'conflict', status: 502, message: 'Could not load PayPal order.' };
  }

  const match = verifyPayPalOrderMatches(order, details);
  if (!match.ok) {
    return { kind: 'mismatch', code: 'ORDER_MISMATCH', message: match.message };
  }

  if (!options.skip3ds) {
    const authResult =
      details.payment_source?.card?.authentication_result ??
      details.payment_source?.google_pay?.card?.authentication_result;
    if (details.payment_source?.card || details.payment_source?.google_pay?.card) {
      const sca = evaluate3dsPolicy(authResult);
      if (!sca.ok) {
        return { kind: 'sca_failed', reason: sca.reason };
      }
    }
  }

  let capture: CaptureOutcome;
  try {
    capture = await deps.payments.captureOrder(paypalOrderId);
  } catch (error) {
    console.error('[checkout] capture failed', error);
    return { kind: 'conflict', status: 502, message: 'PayPal capture failed.' };
  }

  if (capture.outcome === 'pending') {
    return { kind: 'pending', code: 'PENDING_REVIEW' };
  }

  if (capture.outcome === 'declined') {
    if (capture.responseCode) {
      console.warn('[checkout] capture declined', capture.responseCode, paypalOrderId);
    }
    return { kind: 'declined', retryable: true, status: capture.status };
  }

  // Capture completed — settle locally.
  const latest = await deps.orders.get(order.id);
  if (!latest) {
    return { kind: 'conflict', status: 404, message: 'Order not found after capture.' };
  }

  if (latest.status === 'cancelled') {
    return handleCaptureAfterCancel(deps, latest, paypalOrderId);
  }

  if (!latest.paymentSessionId) {
    await deps.orders.attachSession(latest.id, paypalOrderId);
  }

  const settled = await markPaidAndNotify(deps, paypalOrderId);
  if (!settled) {
    // Race: status flipped somehow — treat as conflict
    return { kind: 'conflict', status: 409, message: 'Could not mark order paid.' };
  }
  return { kind: 'paid', order: settled.order, newlyPaid: settled.newlyPaid };
}

/** Settle from a webhook when we already know payment completed. */
export async function settlePaidBySession(
  deps: AppDeps,
  paypalOrderId: string,
  fallbackOrderId?: string,
): Promise<Order | undefined> {
  const newlyPaid = await deps.orders.markPaidBySession(paypalOrderId);
  if (newlyPaid) {
    await clearWelcomeDiscountAfterPurchase(deps, newlyPaid.userId);
    await notifyPaidOrder(deps.email, deps.env, newlyPaid);
    return newlyPaid;
  }
  return (
    (await deps.orders.getByPaymentSession(paypalOrderId)) ??
    (fallbackOrderId ? await deps.orders.get(fallbackOrderId) : undefined)
  );
}

export async function settleRefundedOrder(deps: AppDeps, orderId: string): Promise<void> {
  const existing = await deps.orders.get(orderId);
  if (!existing || existing.status === 'cancelled' || existing.cancelReason) return;
  const result = await cancelOrderAndReleaseStock(deps, orderId, 'Refunded via PayPal.');
  if (result?.order) {
    const { notifyRefundedOrder } = await import('./order-alert.js');
    await notifyRefundedOrder(deps.email, deps.env, result.order);
  }
}
