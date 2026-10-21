import {
  FULFILLMENT_STEP_LABELS,
  type FulfillmentStep,
  type Order,
} from '@akknerds/shared';
import type { AppDeps } from '../context.js';

function orderHref(orderId: string): string {
  return `/account/orders/${orderId}`;
}

/** Best-effort in-app notification when an admin updates a paid order. */
export async function notifyOrderFulfillmentUpdate(
  deps: Pick<AppDeps, 'notifications'>,
  order: Order,
  previous: Pick<Order, 'fulfillmentStep' | 'carrierName' | 'trackingUrl'>,
): Promise<void> {
  if (!order.userId) return;

  const stepChanged = order.fulfillmentStep !== previous.fulfillmentStep;
  const carrierChanged =
    (order.carrierName ?? '') !== (previous.carrierName ?? '') ||
    (order.trackingUrl ?? '') !== (previous.trackingUrl ?? '');

  if (!stepChanged && !carrierChanged) return;

  const step = order.fulfillmentStep as FulfillmentStep | undefined;
  const stepLabel = step ? FULFILLMENT_STEP_LABELS[step] : 'Updated';

  let title = 'Order updated';
  let body = `Your order ${order.id} was updated.`;

  if (stepChanged && step) {
    title = `Order ${stepLabel.toLowerCase()}`;
    body = `Order ${order.id} is now: ${stepLabel}.`;
  } else if (carrierChanged) {
    title = 'Tracking updated';
    const carrier = order.carrierName?.trim();
    body = carrier
      ? `Carrier details added for order ${order.id}: ${carrier}.`
      : `Tracking details were added for order ${order.id}.`;
  }

  try {
    await deps.notifications.create({
      userId: order.userId,
      type: 'order_updated',
      title,
      body,
      href: orderHref(order.id),
      orderId: order.id,
    });
  } catch (error) {
    console.error('[notifications] fulfillment update failed', error);
  }
}

export async function notifyOrderCancelledInApp(
  deps: Pick<AppDeps, 'notifications'>,
  order: Order,
): Promise<void> {
  if (!order.userId) return;
  try {
    await deps.notifications.create({
      userId: order.userId,
      type: 'order_cancelled',
      title: 'Order cancelled',
      body: order.cancelReason?.trim()
        ? `Order ${order.id} was cancelled: ${order.cancelReason.trim()}`
        : `Order ${order.id} was cancelled.`,
      href: orderHref(order.id),
      orderId: order.id,
    });
  } catch (error) {
    console.error('[notifications] cancel notice failed', error);
  }
}
