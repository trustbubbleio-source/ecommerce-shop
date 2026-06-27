import type { Address, Order, OrderLine, OrderStatus } from '@akknerds/shared';
import { nanoid } from 'nanoid';

export interface CreateOrderInput {
  email: string;
  userId?: string;
  lines: OrderLine[];
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  shippingAddress?: Address;
}

/** In-memory order store, isolated per app instance. */
export class OrderRepository {
  private readonly byId = new Map<string, Order>();
  private readonly bySession = new Map<string, string>();

  create(input: CreateOrderInput): Order {
    const order: Order = {
      id: `ord_${nanoid(20)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
      ...input,
    };
    this.byId.set(order.id, order);
    return order;
  }

  get(id: string): Order | undefined {
    return this.byId.get(id);
  }

  attachSession(orderId: string, sessionId: string): void {
    const order = this.byId.get(orderId);
    if (!order) return;
    order.stripeSessionId = sessionId;
    this.bySession.set(sessionId, orderId);
  }

  markStatusBySession(sessionId: string, status: OrderStatus): Order | undefined {
    const orderId = this.bySession.get(sessionId);
    if (!orderId) return undefined;
    return this.setStatus(orderId, status);
  }

  setStatus(orderId: string, status: OrderStatus): Order | undefined {
    const order = this.byId.get(orderId);
    if (!order) return undefined;
    order.status = status;
    return order;
  }

  listByUser(userId: string): Order[] {
    return [...this.byId.values()]
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
