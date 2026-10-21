import type { AppNotification } from '@akknerds/shared';
import { nanoid } from 'nanoid';
import type { CreateNotificationInput, NotificationRepository } from './interfaces.js';

/** In-memory notifications, isolated per app instance. */
export class MemoryNotificationRepository implements NotificationRepository {
  private readonly rows: AppNotification[] = [];

  async create(input: CreateNotificationInput): Promise<AppNotification> {
    const row: AppNotification = {
      id: `ntf_${nanoid(16)}`,
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
      orderId: input.orderId,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
    this.rows.unshift(row);
    return row;
  }

  async listByUser(userId: string, limit = 30): Promise<AppNotification[]> {
    return this.rows.filter((row) => row.userId === userId).slice(0, limit);
  }

  async unreadCount(userId: string): Promise<number> {
    return this.rows.filter((row) => row.userId === userId && !row.readAt).length;
  }

  async markRead(userId: string, ids?: string[]): Promise<number> {
    const now = new Date().toISOString();
    let count = 0;
    for (const row of this.rows) {
      if (row.userId !== userId || row.readAt) continue;
      if (ids && !ids.includes(row.id)) continue;
      row.readAt = now;
      count += 1;
    }
    return count;
  }
}
