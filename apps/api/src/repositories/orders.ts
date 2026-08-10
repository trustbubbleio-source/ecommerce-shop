import type { Order, OrderStatus } from '@akknerds/shared';
import { nanoid } from 'nanoid';
import type { CreateOrderInput, OrderRepository as IOrderRepository } from './interfaces.js';

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

  async attachSession(orderId: string, sessionId: string): Promise<void> {
    const order = this.byId.get(orderId);
    if (!order) return;
    order.stripeSessionId = sessionId;
    this.bySession.set(sessionId, orderId);
  }

  async markStatusBySession(sessionId: string, status: OrderStatus): Promise<Order | undefined> {
    const orderId = this.bySession.get(sessionId);
    if (!orderId) return undefined;
    return this.setStatus(orderId, status);
  }

  async setStatus(orderId: string, status: OrderStatus): Promise<Order | undefined> {
    const order = this.byId.get(orderId);
    if (!order) return undefined;
    order.status = status;
    return order;
  }

  async listByUser(userId: string): Promise<Order[]> {
    return [...this.byId.values()]
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
