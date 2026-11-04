import {
  normalizeDiscountCode,
  normalizeDiscountEmail,
  type DiscountCodeDef,
  type DiscountKind,
} from '@akknerds/shared';
import { prisma } from '@akknerds/db';
import type { DiscountRepository, StoredDiscountCode } from '../interfaces.js';

function mapRow(row: {
  id: string;
  code: string;
  label: string;
  kind: string;
  value: number;
  allowedEmail: string | null;
  allowedUserId: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): StoredDiscountCode {
  return {
    id: row.id,
    code: row.code,
    label: row.label,
    kind: row.kind as DiscountKind,
    value: row.value,
    allowedEmail: row.allowedEmail,
    allowedUserId: row.allowedUserId,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

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

export class PrismaDiscountRepository implements DiscountRepository {
  async list(): Promise<StoredDiscountCode[]> {
    const rows = await prisma.discountCode.findMany({ orderBy: { createdAt: 'desc' } });
    return rows.map(mapRow);
  }

  async findByCode(code: string): Promise<StoredDiscountCode | undefined> {
    const row = await prisma.discountCode.findUnique({
      where: { code: normalizeDiscountCode(code) },
    });
    return row ? mapRow(row) : undefined;
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
    const row = await prisma.discountCode.create({
      data: {
        code: normalizeDiscountCode(input.code),
        label: input.label.trim(),
        kind: input.kind,
        value: input.value,
        allowedEmail: input.allowedEmail ? normalizeDiscountEmail(input.allowedEmail) : null,
        allowedUserId: input.allowedUserId ?? null,
      },
    });
    return mapRow(row);
  }

  async setActive(id: string, active: boolean): Promise<StoredDiscountCode | undefined> {
    try {
      const row = await prisma.discountCode.update({ where: { id }, data: { active } });
      return mapRow(row);
    } catch {
      return undefined;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await prisma.discountCode.delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }
}
