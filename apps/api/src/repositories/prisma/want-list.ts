import { prisma } from '@akknerds/db';
import type {
  WantListAdminItem,
  WantListItem,
  WantListPresetId,
  WantListStatus,
} from '@akknerds/shared';
import type { CreateWantListInput, WantListRepository } from '../interfaces.js';

function toPublic(row: {
  id: string;
  userId: string;
  preset: string;
  title: string;
  notes: string;
  status: string;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}): WantListItem {
  return {
    id: row.id,
    userId: row.userId,
    preset: row.preset as WantListPresetId,
    title: row.title,
    notes: row.notes,
    status: row.status as WantListStatus,
    adminNote: row.adminNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaWantListRepository implements WantListRepository {
  async listByUser(userId: string): Promise<WantListItem[]> {
    const rows = await prisma.wantListItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toPublic);
  }

  async listAll(): Promise<WantListAdminItem[]> {
    const rows = await prisma.wantListItem.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => ({
      ...toPublic(row),
      user: row.user,
    }));
  }

  async create(input: CreateWantListInput): Promise<WantListItem> {
    const row = await prisma.wantListItem.create({
      data: {
        userId: input.userId,
        preset: input.preset,
        title: input.title,
        notes: input.notes,
      },
    });
    return toPublic(row);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await prisma.wantListItem.deleteMany({ where: { id, userId } });
    return result.count > 0;
  }

  async updateStatus(
    id: string,
    input: { status: string; adminNote?: string | null },
  ): Promise<WantListAdminItem | undefined> {
    try {
      const row = await prisma.wantListItem.update({
        where: { id },
        data: {
          status: input.status,
          ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      });
      return { ...toPublic(row), user: row.user };
    } catch {
      return undefined;
    }
  }
}
