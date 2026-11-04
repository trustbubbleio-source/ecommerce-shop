import {
  normalizeDiscountCode,
  normalizeDiscountEmail,
  type DiscountCodeDef,
  type DiscountKind,
} from '@akknerds/shared';
import { nanoid } from 'nanoid';
import type { DiscountRepository, StoredDiscountCode } from './interfaces.js';

function toDef(row: StoredDiscountCode): DiscountCodeDef {
  return {
    code: row.code,
    label: row.label,
    kind: row.kind,
    value: row.value,
    allowedEmail: row.allowedEmail,
    allowedUserId: row.allowedUserId,
    active: row.active,
    clearAfterPurchase: Boolean(row.allowedEmail || row.allowedUserId),
  };
}

export class MemoryDiscountRepository implements DiscountRepository {
  private rows = new Map<string, StoredDiscountCode>();

  async list(): Promise<StoredDiscountCode[]> {
    return [...this.rows.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async findByCode(code: string): Promise<StoredDiscountCode | undefined> {
    const normalized = normalizeDiscountCode(code);
    return [...this.rows.values()].find((row) => row.code === normalized);
  }

  async findActiveDef(code: string): Promise<DiscountCodeDef | undefined> {
    const row = await this.findByCode(code);
    if (!row || !row.active) return undefined;
    return toDef(row);
  }

  async create(input: {
    code: string;
    label: string;
    kind: DiscountKind;
    value: number;
    allowedEmail?: string | null;
    allowedUserId?: string | null;
  }): Promise<StoredDiscountCode> {
    const now = new Date().toISOString();
    const row: StoredDiscountCode = {
      id: `disc_${nanoid(10)}`,
      code: normalizeDiscountCode(input.code),
      label: input.label.trim(),
      kind: input.kind,
      value: input.value,
      allowedEmail: input.allowedEmail ? normalizeDiscountEmail(input.allowedEmail) : null,
      allowedUserId: input.allowedUserId ?? null,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(row.id, row);
    return row;
  }

  async setActive(id: string, active: boolean): Promise<StoredDiscountCode | undefined> {
    const row = this.rows.get(id);
    if (!row) return undefined;
    const next = { ...row, active, updatedAt: new Date().toISOString() };
    this.rows.set(id, next);
    return next;
  }

  async delete(id: string): Promise<boolean> {
    return this.rows.delete(id);
  }
}
