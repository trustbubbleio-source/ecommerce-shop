import type { WantListAdminItem, WantListItem, WantListPresetId, WantListStatus } from '@akknerds/shared';
import { nanoid } from 'nanoid';
import type {
  CreateWantListInput,
  UserRepository,
  WantListRepository as IWantListRepository,
} from './interfaces.js';

interface StoredWantListItem {
  id: string;
  userId: string;
  preset: WantListPresetId;
  title: string;
  notes: string;
  status: WantListStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export class WantListRepository implements IWantListRepository {
  private readonly items: StoredWantListItem[] = [];

  constructor(private readonly users: UserRepository) {}

  private toPublic(row: StoredWantListItem): WantListItem {
    return { ...row };
  }

  async listByUser(userId: string): Promise<WantListItem[]> {
    return this.items
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((item) => this.toPublic(item));
  }

  async listAll(): Promise<WantListAdminItem[]> {
    const sorted = [...this.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const out: WantListAdminItem[] = [];
    for (const item of sorted) {
      const user = await this.users.findById(item.userId);
      out.push({
        ...this.toPublic(item),
        user: {
          id: item.userId,
          name: user?.name ?? 'Member',
          email: user?.email ?? '',
        },
      });
    }
    return out;
  }

  async create(input: CreateWantListInput): Promise<WantListItem> {
    const now = new Date().toISOString();
    const row: StoredWantListItem = {
      id: `want_${nanoid(16)}`,
      userId: input.userId,
      preset: input.preset as WantListPresetId,
      title: input.title,
      notes: input.notes,
      status: 'pending',
      adminNote: null,
      createdAt: now,
      updatedAt: now,
    };
    this.items.push(row);
    return this.toPublic(row);
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const index = this.items.findIndex((item) => item.id === id && item.userId === userId);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }

  async updateStatus(
    id: string,
    input: { status: string; adminNote?: string | null },
  ): Promise<WantListAdminItem | undefined> {
    const row = this.items.find((item) => item.id === id);
    if (!row) return undefined;
    row.status = input.status as WantListStatus;
    if (input.adminNote !== undefined) row.adminNote = input.adminNote;
    row.updatedAt = new Date().toISOString();
    const user = await this.users.findById(row.userId);
    return {
      ...this.toPublic(row),
      user: {
        id: row.userId,
        name: user?.name ?? 'Member',
        email: user?.email ?? '',
      },
    };
  }
}
