import { Hono } from 'hono';
import type { AppDeps, AppEnv } from '../context.js';
import { cancelOrderAndReleaseStock } from '../lib/inventory.js';
import { clearWelcomeDiscountAfterPurchase } from '../lib/welcome-discount.js';
import { notifyPaidOrder, notifyRefundedOrder } from '../lib/order-alert.js';

/**
 * PayPal webhook + capture helper routes.
 *
 * Browser return from PayPal hits checkout success with `token=<PAYPAL_ORDER_ID>`;
 * the web app calls POST /api/webhooks/paypal/capture to finish settlement.
 * Optional PayPal Dashboard webhooks can also POST here for capture/refund events.
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
    if (!sessionId && orderId) {
      const order = await deps.orders.get(orderId);
      sessionId = order?.paymentSessionId ?? '';
    }
    if (!sessionId) {
      return c.json({ error: 'No PayPal order to capture' }, 404);
    }

    // Ensure the session is linked if PayPal only returned token on the success URL.
    if (orderId && paypalOrderId) {
      const order = await deps.orders.get(orderId);
      if (order && !order.paymentSessionId) {
        await deps.orders.attachSession(orderId, paypalOrderId);
      }
    }

    const capture = await deps.payments.captureOrder(sessionId);
    if (!capture.captured) {
      return c.json({ error: 'Capture not completed', status: capture.status }, 409);
    }

    const newlyPaid = await deps.orders.markPaidBySession(sessionId);
    if (newlyPaid) {
      await clearWelcomeDiscountAfterPurchase(deps, newlyPaid.userId);
      await notifyPaidOrder(deps.email, deps.env, newlyPaid);
    }

    const order =
      newlyPaid ??
      (await deps.orders.getByPaymentSession(sessionId)) ??
      (orderId ? await deps.orders.get(orderId) : undefined);

    return c.json({ ok: true, orderId: order?.id, status: order?.status ?? 'paid' });
  });

  app.post('/paypal', async (c) => {
    if (!deps.payments.enabled) {
      return c.json({ received: true, mock: true });
    }

    const event = await c.req.json().catch(() => null);
    if (!event || typeof event !== 'object') {
      return c.json({ error: 'Invalid payload' }, 400);
    }

    const eventType = String((event as { event_type?: string }).event_type ?? '');
    const resource = (event as { resource?: Record<string, unknown> }).resource ?? {};

    if (
      eventType === 'PAYMENT.CAPTURE.COMPLETED' ||
      eventType === 'CHECKOUT.ORDER.COMPLETED'
    ) {
      const customId =
        (typeof resource.custom_id === 'string' && resource.custom_id) ||
        (typeof (resource as { purchase_units?: Array<{ custom_id?: string }> }).purchase_units?.[0]
          ?.custom_id === 'string' &&
          (resource as { purchase_units: Array<{ custom_id?: string }> }).purchase_units[0]
            .custom_id) ||
        undefined;

      const supplementary =
        (resource as { supplementary_data?: { related_ids?: { order_id?: string } } })
          .supplementary_data?.related_ids?.order_id;

      const paypalOrderId =
        (typeof resource.id === 'string' && eventType === 'CHECKOUT.ORDER.COMPLETED'
          ? resource.id
          : undefined) ||
        supplementary ||
        (customId
          ? (await deps.orders.get(customId))?.paymentSessionId
          : undefined);

      if (paypalOrderId) {
        const newlyPaid = await deps.orders.markPaidBySession(paypalOrderId);
        if (newlyPaid) {
          await clearWelcomeDiscountAfterPurchase(deps, newlyPaid.userId);
          await notifyPaidOrder(deps.email, deps.env, newlyPaid);
        }
      } else if (customId) {
        const existing = await deps.orders.get(customId);
        if (existing?.status === 'pending') {
          const paid = await deps.orders.setStatus(existing.id, 'paid');
          if (paid) {
            await clearWelcomeDiscountAfterPurchase(deps, paid.userId);
            await notifyPaidOrder(deps.email, deps.env, paid);
          }
        }
      }
    }

    if (eventType === 'PAYMENT.CAPTURE.DENIED' || eventType === 'CHECKOUT.ORDER.VOIDED') {
      const customId = typeof resource.custom_id === 'string' ? resource.custom_id : undefined;
      if (customId) {
        const existing = await deps.orders.get(customId);
        if (existing?.status === 'pending') {
          await cancelOrderAndReleaseStock(
            deps,
            existing.id,
            'PayPal checkout was voided or denied before payment.',
          );
        }
      }
    }

    if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
      const customId = typeof resource.custom_id === 'string' ? resource.custom_id : undefined;
      const orderId = customId;
      if (orderId) {
        const existing = await deps.orders.get(orderId);
        if (existing && existing.status !== 'cancelled' && !existing.cancelReason) {
          const result = await cancelOrderAndReleaseStock(
            deps,
            orderId,
            'Refunded via PayPal.',
          );
          if (result?.order) {
            await notifyRefundedOrder(deps.email, deps.env, result.order);
          }
        }
      }
    }

    return c.json({ received: true });
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
