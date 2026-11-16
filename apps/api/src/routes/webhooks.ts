import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { cancelOrderAndReleaseStock } from '../lib/inventory.js';
import { notifyRefundedOrder } from '../lib/order-alert.js';
import { captureAndSettle, settlePaidBySession } from '../lib/settle-payment.js';

/**
 * PayPal webhook + capture helper routes.
 *
 * Browser return from PayPal hits checkout success with `token=<PAYPAL_ORDER_ID>`;
 * the web app calls POST /api/webhooks/paypal/capture to finish settlement.
 * Dashboard webhooks POST to /api/webhooks/paypal (signature verified).
 */
export function webhookRoutes(deps: AppDeps) {
  const app = new Hono<AppEnv>();

  app.post('/paypal/capture', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const paypalOrderId =
      (typeof body?.paypalOrderId === 'string' && body.paypalOrderId) ||
      (typeof body?.token === 'string' && body.token) ||
      c.req.query('token') ||
      '';
    const orderId = typeof body?.orderId === 'string' ? body.orderId : c.req.query('order_id');

    if (!paypalOrderId && !orderId) {
      return c.json({ error: 'paypalOrderId or orderId required' }, 400);
    }

    let sessionId = paypalOrderId;
    let order = orderId ? await deps.orders.get(orderId) : undefined;
    if (!sessionId && order) {
      sessionId = order.paymentSessionId ?? '';
    }
    if (!sessionId) {
      return c.json({ error: 'No PayPal order to capture' }, 404);
    }

    if (!order) {
      order = await deps.orders.getByPaymentSession(sessionId);
    }

    // Ensure the session is linked if PayPal only returned token on the success URL.
    if (order && !order.paymentSessionId && paypalOrderId) {
      await deps.orders.attachSession(order.id, paypalOrderId);
      order = { ...order, paymentSessionId: paypalOrderId };
    }

    if (!order) {
      // Legacy path: try markPaidBySession after capture without local order lookup.
      const capture = await deps.payments.captureOrder(sessionId);
      if (capture.outcome !== 'completed') {
        return c.json({ error: 'Capture not completed', status: capture.status }, 409);
      }
      const settled = await settlePaidBySession(deps, sessionId);
      return c.json({ ok: true, orderId: settled?.id, status: settled?.status ?? 'paid' });
    }

    const result = await captureAndSettle(deps, order, sessionId);
    if (result.kind === 'paid') {
      return c.json({ ok: true, orderId: result.order.id, status: result.order.status });
    }
    if (result.kind === 'pending') {
      return c.json({ ok: false, status: 'pending', code: 'PENDING_REVIEW' }, 202);
    }
    if (result.kind === 'declined' || result.kind === 'sca_failed') {
      return c.json(
        {
          error: result.kind === 'sca_failed' ? result.reason : 'Capture not completed',
          status: result.kind === 'declined' ? result.status : 'SCA_FAILED',
        },
        409,
      );
    }
    if (result.kind === 'mismatch') {
      return c.json({ error: result.message }, 409);
    }
    const status = result.status === 404 || result.status === 502 ? result.status : 409;
    return c.json({ error: result.message }, status);
  });

  app.post('/paypal', async (c) => {
    if (!deps.payments.enabled) {
      return c.json({ received: true, mock: true });
    }

    const rawBody = await c.req.text();
    const headerBag: Record<string, string | undefined> = {};
    for (const [key, value] of c.req.raw.headers.entries()) {
      headerBag[key.toLowerCase()] = value;
    }

    const verified = await deps.payments.verifyWebhook(headerBag, rawBody);
    if (!verified) {
      console.warn('[paypal] webhook signature rejected');
      // Return 200 so PayPal does not retry-storm on forgeries.
      return c.json({ received: true, verified: false });
    }

    let event: { event_type?: string; resource?: Record<string, unknown> } | null = null;
    try {
      event = JSON.parse(rawBody) as { event_type?: string; resource?: Record<string, unknown> };
    } catch {
      return c.json({ error: 'Invalid payload' }, 400);
    }

    const eventType = String(event.event_type ?? '');
    const resource = event.resource ?? {};

    if (eventType === 'PAYMENT.CAPTURE.COMPLETED') {
      const customId = typeof resource.custom_id === 'string' ? resource.custom_id : undefined;
      const supplementary = (
        resource as { supplementary_data?: { related_ids?: { order_id?: string } } }
      ).supplementary_data?.related_ids?.order_id;

      const paypalOrderId =
        supplementary ||
        (customId ? (await deps.orders.get(customId))?.paymentSessionId : undefined);

      if (paypalOrderId) {
        await settlePaidBySession(deps, paypalOrderId, customId);
      }
    }

    if (
      eventType === 'PAYMENT.CAPTURE.DECLINED' ||
      eventType === 'PAYMENT.CAPTURE.DENIED' ||
      eventType === 'PAYMENT.CAPTURE.PENDING'
    ) {
      // Leave pending; cleanup job / buyer retry handles it.
      return c.json({ received: true, ignored: eventType });
    }

    if (eventType === 'PAYMENT.CAPTURE.REFUNDED' || eventType === 'PAYMENT.CAPTURE.REVERSED') {
      const customId = typeof resource.custom_id === 'string' ? resource.custom_id : undefined;
      if (customId) {
        const existing = await deps.orders.get(customId);
        if (existing && existing.status !== 'cancelled' && !existing.cancelReason) {
          const result = await cancelOrderAndReleaseStock(
            deps,
            customId,
            eventType === 'PAYMENT.CAPTURE.REVERSED' ? 'Payment reversed via PayPal.' : 'Refunded via PayPal.',
          );
          if (result?.order) {
            await notifyRefundedOrder(deps.email, deps.env, result.order);
          }
        }
      }
    }

    if (eventType === 'CHECKOUT.ORDER.APPROVED') {
      const paypalOrderId = typeof resource.id === 'string' ? resource.id : undefined;
      if (paypalOrderId) {
        const order = await deps.orders.getByPaymentSession(paypalOrderId);
        if (order?.status === 'pending') {
          await captureAndSettle(deps, order, paypalOrderId);
        }
      }
    }

    if (eventType === 'CHECKOUT.PAYMENT-APPROVAL.REVERSED') {
      const paypalOrderId = typeof resource.id === 'string' ? resource.id : undefined;
      const order = paypalOrderId
        ? await deps.orders.getByPaymentSession(paypalOrderId)
        : undefined;
      if (order?.status === 'pending') {
        await cancelOrderAndReleaseStock(
          deps,
          order.id,
          'PayPal payment approval was reversed.',
        );
      }
    }

    if (eventType === 'CUSTOMER.DISPUTE.CREATED') {
      console.warn('[paypal] dispute created', resource);
    }

    return c.json({ received: true, verified: true });
  });

  /**
   * Zettle Pusher webhooks.
   * Subscribe InventoryBalanceChanged → https://<api>/api/webhooks/zettle
   * Payload.balanceAfter[].balance is the absolute STORE qty for that variant.
   */
  app.post('/zettle', async (c) => {
    const event = await c.req.json().catch(() => null);
    if (!event || typeof event !== 'object') {
      return c.json({ error: 'Invalid payload' }, 400);
    }

    const eventName = String(
      (event as { eventName?: string; event_name?: string }).eventName ??
        (event as { event_name?: string }).event_name ??
        '',
    );

    let payloadRaw = (event as { payload?: unknown }).payload;
    let payload: Record<string, unknown> = {};
    if (typeof payloadRaw === 'string') {
      try {
        payload = JSON.parse(payloadRaw) as Record<string, unknown>;
      } catch {
        payload = {};
      }
    } else if (payloadRaw && typeof payloadRaw === 'object') {
      payload = payloadRaw as Record<string, unknown>;
    }

    if (eventName === 'InventoryBalanceChanged') {
      const after = Array.isArray(payload.balanceAfter)
        ? (payload.balanceAfter as Array<Record<string, unknown>>)
        : [];
      let updated = 0;
      for (const row of after) {
        const variantUuid = typeof row.variantUuid === 'string' ? row.variantUuid : '';
        const balanceRaw = row.balance;
        const balance =
          typeof balanceRaw === 'number'
            ? balanceRaw
            : typeof balanceRaw === 'string'
              ? Number.parseInt(balanceRaw, 10)
              : NaN;
        if (!variantUuid || !Number.isFinite(balance)) continue;

        const product = await deps.products.getByZettleVariantUuid(variantUuid);
        if (!product) continue;
        await deps.products.setStock(product.id, Math.max(0, balance));
        updated += 1;
      }
      return c.json({ received: true, eventName, updated });
    }

    return c.json({ received: true, eventName, ignored: true });
  });

  // Legacy path — keep temporarily so old Stripe webhook URLs do not 404 hard.
  app.post('/stripe', (c) => c.json({ error: 'Stripe is no longer supported. Use PayPal.' }, 410));

  return app;
}
