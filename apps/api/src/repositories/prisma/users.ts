import { prisma } from '@akknerds/db';
import type { UserRole } from '@akknerds/shared';
import { nanoid } from 'nanoid';
import type { StoredUser } from '../users.js';
import type { UserRepository } from '../interfaces.js';

function toStored(row: {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  googleSub: string | null;
  role: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}): StoredUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    googleSub: row.googleSub,
    role: row.role as UserRole,
    emailVerifiedAt: row.emailVerifiedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<StoredUser | undefined> {
    const row = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return row ? toStored(row) : undefined;
  }

  async findById(id: string): Promise<StoredUser | undefined> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? toStored(row) : undefined;
  }

  async findByGoogleSub(googleSub: string): Promise<StoredUser | undefined> {
    const row = await prisma.user.findUnique({ where: { googleSub } });
    return row ? toStored(row) : undefined;
  }

  async create(input: {
    email: string;
    name: string;
    passwordHash?: string | null;
    googleSub?: string | null;
    role?: UserRole;
    emailVerifiedAt?: string | null;
  }): Promise<StoredUser> {
    const row = await prisma.user.create({
      data: {
        id: `usr_${nanoid(16)}`,
        email: input.email.toLowerCase(),
        name: input.name,
        passwordHash: input.passwordHash ?? null,
        googleSub: input.googleSub ?? null,
        role: input.role ?? 'customer',
        emailVerifiedAt: input.emailVerifiedAt ? new Date(input.emailVerifiedAt) : null,
      },
    });
    return toStored(row);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<StoredUser | undefined> {
    try {
      const row = await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });
      return toStored(row);
    } catch {
      return undefined;
    }
  }

  async updateProfile(userId: string, input: { name: string }): Promise<StoredUser | undefined> {
    try {
      const row = await prisma.user.update({
        where: { id: userId },
        data: { name: input.name },
      });
      return toStored(row);
    } catch {
      return undefined;
    }
  }

  async linkGoogle(userId: string, googleSub: string): Promise<StoredUser | undefined> {
    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return undefined;
    if (existing.googleSub && existing.googleSub !== googleSub) return undefined;
    try {
      const row = await prisma.user.update({
        where: { id: userId },
        data: {
          googleSub,
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        },
      });
      return toStored(row);
    } catch {
      return undefined;
    }
  }

  async markEmailVerified(userId: string): Promise<StoredUser | undefined> {
    try {
      const existing = await prisma.user.findUnique({ where: { id: userId } });
      if (!existing) return undefined;
      if (existing.emailVerifiedAt) return toStored(existing);
      const row = await prisma.user.update({
        where: { id: userId },
        data: { emailVerifiedAt: new Date() },
      });
      return toStored(row);
    } catch {
      return undefined;
    }
  }
}
