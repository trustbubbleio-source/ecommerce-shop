import { prisma, toOrder } from '@akknerds/db';
import { defaultFulfillmentStep, type OrderStatus } from '@akknerds/shared';
import type { Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';
import type { CreateOrderInput, OrderFulfillmentPatch, OrderRepository } from '../interfaces.js';

function statusPatch(currentStep: string | null, status: OrderStatus): Prisma.OrderUpdateInput {
  const data: Prisma.OrderUpdateInput = { status };
  if (status === 'cancelled') {
    data.fulfillmentStep = null;
    return data;
  }
  const next = defaultFulfillmentStep(status);
  if (status === 'fulfilled') data.fulfillmentStep = 'delivered';
  else if (next && !currentStep) data.fulfillmentStep = next;
  return data;
}

export class PrismaOrderRepository implements OrderRepository {
  async create(input: CreateOrderInput) {
    const row = await prisma.order.create({
      data: {
        id: `ord_${nanoid(20)}`,
        status: 'pending',
        email: input.email,
        userId: input.userId,
        lines: input.lines as unknown as Prisma.InputJsonValue,
        subtotal: input.subtotal,
        shipping: input.shipping,
        total: input.total,
        currency: input.currency,
        shippingAddress: (input.shippingAddress ?? undefined) as unknown as
          | Prisma.InputJsonValue
          | undefined,
      },
    });
    return toOrder(row);
  }

  async get(id: string) {
    const row = await prisma.order.findUnique({ where: { id } });
    return row ? toOrder(row) : undefined;
  }

  async getByStripeSession(sessionId: string) {
    const row = await prisma.order.findUnique({ where: { stripeSessionId: sessionId } });
    return row ? toOrder(row) : undefined;
  }

  async listAll() {
    const rows = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toOrder);
  }

  async attachSession(orderId: string, sessionId: string): Promise<void> {
    await prisma.order.updateMany({
      where: { id: orderId },
      data: { stripeSessionId: sessionId },
    });
  }

  async setInvoiceUrl(orderId: string, invoiceUrl: string): Promise<void> {
    await prisma.order.updateMany({
      where: { id: orderId },
      data: { invoiceUrl },
    });
  }

  async updateFulfillment(orderId: string, input: OrderFulfillmentPatch) {
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) return undefined;
    if (existing.status !== 'paid' && existing.status !== 'fulfilled') return undefined;
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        fulfillmentStep: input.fulfillmentStep,
        status: input.fulfillmentStep === 'delivered' ? 'fulfilled' : 'paid',
        ...(input.carrierName !== undefined
          ? { carrierName: input.carrierName.trim() || null }
          : {}),
        ...(input.trackingUrl !== undefined
          ? { trackingUrl: input.trackingUrl.trim() || null }
          : {}),
      },
    });
    return toOrder(updated);
  }

  async markStatusBySession(sessionId: string, status: OrderStatus) {
    const row = await prisma.order.findUnique({ where: { stripeSessionId: sessionId } });
    if (!row) return undefined;
    const updated = await prisma.order.update({
      where: { id: row.id },
      data: statusPatch(row.fulfillmentStep, status),
    });
    return toOrder(updated);
  }

  async setStatus(orderId: string, status: OrderStatus) {
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) return undefined;
    const updated = await prisma.order.update({
      where: { id: orderId },
      data: statusPatch(existing.fulfillmentStep, status),
    });
    return toOrder(updated);
  }

  async listByUser(userId: string) {
    const rows = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toOrder);
  }

  async hasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    const rows = await prisma.order.findMany({
      where: {
        userId,
        status: { in: ['paid', 'fulfilled'] },
      },
      select: { lines: true },
    });
    return rows.some((row) => {
      const lines = row.lines as Array<{ productId?: string }>;
      return Array.isArray(lines) && lines.some((line) => line.productId === productId);
    });
  }
}
