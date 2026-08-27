import type { Order, OrderStatus } from '@akknerds/shared';
import { defaultFulfillmentStep } from '@akknerds/shared';
import { nanoid } from 'nanoid';
import type {
  CreateOrderInput,
  OrderFulfillmentPatch,
  OrderRepository as IOrderRepository,
} from './interfaces.js';

function applyStatus(order: Order, status: OrderStatus): Order {
  order.status = status;
  if (status === 'cancelled') {
    order.fulfillmentStep = undefined;
    return order;
  }
  const next = defaultFulfillmentStep(status);
  if (next && !order.fulfillmentStep) order.fulfillmentStep = next;
  if (status === 'fulfilled') order.fulfillmentStep = 'delivered';
  return order;
}

/** In-memory order store, isolated per app instance. */
export class OrderRepository implements IOrderRepository {
  private readonly byId = new Map<string, Order>();
  private readonly bySession = new Map<string, string>();

  async create(input: CreateOrderInput): Promise<Order> {
    const order: Order = {
      id: `ord_${nanoid(20)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.byId.set(order.id, order);
    return order;
  }

  async get(id: string): Promise<Order | undefined> {
    return this.byId.get(id);
  }

  async getByStripeSession(sessionId: string): Promise<Order | undefined> {
    const orderId = this.bySession.get(sessionId);
    return orderId ? this.byId.get(orderId) : undefined;
  }

  async listAll(): Promise<Order[]> {
    return [...this.byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async attachSession(orderId: string, sessionId: string): Promise<void> {
    const order = this.byId.get(orderId);
    if (!order) return;
    order.stripeSessionId = sessionId;
    this.bySession.set(sessionId, orderId);
  }

  async setInvoiceUrl(orderId: string, invoiceUrl: string): Promise<void> {
    const order = this.byId.get(orderId);
    if (!order) return;
    order.invoiceUrl = invoiceUrl;
  }

  async updateFulfillment(orderId: string, input: OrderFulfillmentPatch): Promise<Order | undefined> {
    const order = this.byId.get(orderId);
    if (!order) return undefined;
    if (order.status !== 'paid' && order.status !== 'fulfilled') return undefined;
    order.fulfillmentStep = input.fulfillmentStep;
    order.status = input.fulfillmentStep === 'delivered' ? 'fulfilled' : 'paid';
    if (input.carrierName !== undefined) {
      order.carrierName = input.carrierName.trim() || undefined;
    }
    if (input.trackingUrl !== undefined) {
      order.trackingUrl = input.trackingUrl.trim() || undefined;
    }
    return order;
  }

  async markStatusBySession(sessionId: string, status: OrderStatus): Promise<Order | undefined> {
    const orderId = this.bySession.get(sessionId);
    if (!orderId) return undefined;
    return this.setStatus(orderId, status);
  }

  async setStatus(orderId: string, status: OrderStatus): Promise<Order | undefined> {
    const order = this.byId.get(orderId);
    if (!order) return undefined;
    return applyStatus(order, status);
  }

  async listByUser(userId: string): Promise<Order[]> {
    return [...this.byId.values()]
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async hasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    return [...this.byId.values()].some(
      (o) =>
        o.userId === userId &&
        (o.status === 'paid' || o.status === 'fulfilled') &&
        o.lines.some((line) => line.productId === productId),
    );
  }
}
