import type { PublicUser } from '@akknerds/shared';
import { nanoid } from 'nanoid';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}

export function toPublicUser(user: StoredUser): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

/**
 * In-memory user store. Each app instance owns its own store, keeping tests
 * isolated. Replace with a database-backed repository for production.
 */
export class UserRepository {
  private readonly byEmail = new Map<string, StoredUser>();

  findByEmail(email: string): StoredUser | undefined {
    return this.byEmail.get(email.toLowerCase());
  }

  create(input: { email: string; name: string; passwordHash: string }): StoredUser {
    const user: StoredUser = {
      id: `usr_${nanoid(16)}`,
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash: input.passwordHash,
      createdAt: new Date().toISOString(),
    };
    this.byEmail.set(user.email, user);
    return user;
  }

  get size(): number {
    return this.byEmail.size;
  }
}
