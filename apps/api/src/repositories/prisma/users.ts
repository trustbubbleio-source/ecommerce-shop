import { prisma } from '@akknerds/db';
import type { UserRole } from '@akknerds/shared';
import { nanoid } from 'nanoid';
import type { StoredUser } from '../users.js';
import type { UserRepository } from '../interfaces.js';

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<StoredUser | undefined> {
    const row = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!row) return undefined;
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.passwordHash,
      role: row.role as UserRole,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async create(input: {
    email: string;
    name: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<StoredUser> {
    const row = await prisma.user.create({
      data: {
        id: `usr_${nanoid(16)}`,
        email: input.email.toLowerCase(),
        name: input.name,
        passwordHash: input.passwordHash,
        role: input.role ?? 'customer',
      },
    });
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.passwordHash,
      role: row.role as UserRole,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
