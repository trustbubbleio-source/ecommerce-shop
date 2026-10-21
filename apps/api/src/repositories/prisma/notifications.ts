import { prisma } from '@akknerds/db';
import type { AppNotification, NotificationType } from '@akknerds/shared';
import { nanoid } from 'nanoid';
import type { CreateNotificationInput, NotificationRepository } from '../interfaces.js';

function toNotification(row: {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  href: string;
  orderId: string | null;
  readAt: Date | null;
  createdAt: Date;
}): AppNotification {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    href: row.href,
    orderId: row.orderId ?? undefined,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class PrismaNotificationRepository implements NotificationRepository {
  async create(input: CreateNotificationInput): Promise<AppNotification> {
    const row = await prisma.notification.create({
      data: {
        id: `ntf_${nanoid(16)}`,
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href,
        orderId: input.orderId,
      },
    });
    return toNotification(row);
  }

  async listByUser(userId: string, limit = 30): Promise<AppNotification[]> {
    const rows = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(toNotification);
  }

  async unreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, readAt: null },
    });
  }

  async markRead(userId: string, ids?: string[]): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
        ...(ids ? { id: { in: ids } } : {}),
      },
      data: { readAt: new Date() },
    });
    return result.count;
  }
}
