import type { PublicUser, UserRole } from '@akknerds/shared';
import { nanoid } from 'nanoid';
import type { UserRepository as IUserRepository } from './interfaces.js';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

export function toPublicUser(user: StoredUser): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

/**
 * In-memory user store. Each app instance owns its own store, keeping tests
 * isolated. Used when DATABASE_URL is not configured.
 */
export class UserRepository implements IUserRepository {
  private readonly byEmail = new Map<string, StoredUser>();

  async findByEmail(email: string): Promise<StoredUser | undefined> {
    return this.byEmail.get(email.toLowerCase());
  }

  async create(input: {
    email: string;
    name: string;
    passwordHash: string;
    role?: UserRole;
  }): Promise<StoredUser> {
    const user: StoredUser = {
      id: `usr_${nanoid(16)}`,
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash: input.passwordHash,
      role: input.role ?? 'customer',
      createdAt: new Date().toISOString(),
    };
    this.byEmail.set(user.email, user);
    return user;
  }
}
