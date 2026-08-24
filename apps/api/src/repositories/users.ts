import type { PublicUser, UserRole } from '@akknerds/shared';
import { nanoid } from 'nanoid';
import type { UserRepository as IUserRepository } from './interfaces.js';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  googleSub: string | null;
  role: UserRole;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt,
    hasPassword: Boolean(user.passwordHash),
    createdAt: user.createdAt,
  };
}

export function isEmailVerified(user: StoredUser): boolean {
  return Boolean(user.emailVerifiedAt);
}

export function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim() || 'collector';
  return local.slice(0, 80);
}

/**
 * In-memory user store. Each app instance owns its own store, keeping tests
 * isolated. Used when DATABASE_URL is not configured.
 */
export class UserRepository implements IUserRepository {
  private readonly byEmail = new Map<string, StoredUser>();
  private readonly byId = new Map<string, StoredUser>();
  private readonly byGoogleSub = new Map<string, StoredUser>();

  async findByEmail(email: string): Promise<StoredUser | undefined> {
    return this.byEmail.get(email.toLowerCase());
  }

  async findById(id: string): Promise<StoredUser | undefined> {
    return this.byId.get(id);
  }

  async findByGoogleSub(googleSub: string): Promise<StoredUser | undefined> {
    return this.byGoogleSub.get(googleSub);
  }

  private save(user: StoredUser): StoredUser {
    this.byId.set(user.id, user);
    this.byEmail.set(user.email, user);
    if (user.googleSub) this.byGoogleSub.set(user.googleSub, user);
    return user;
  }

  async create(input: {
    email: string;
    name: string;
    passwordHash?: string | null;
    googleSub?: string | null;
    role?: UserRole;
    emailVerifiedAt?: string | null;
  }): Promise<StoredUser> {
    const user: StoredUser = {
      id: `usr_${nanoid(16)}`,
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash: input.passwordHash ?? null,
      googleSub: input.googleSub ?? null,
      role: input.role ?? 'customer',
      emailVerifiedAt: input.emailVerifiedAt ?? null,
      createdAt: new Date().toISOString(),
    };
    return this.save(user);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<StoredUser | undefined> {
    const user = this.byId.get(userId);
    if (!user) return undefined;
    return this.save({ ...user, passwordHash });
  }

  async updateProfile(userId: string, input: { name: string }): Promise<StoredUser | undefined> {
    const user = this.byId.get(userId);
    if (!user) return undefined;
    return this.save({ ...user, name: input.name });
  }

  async linkGoogle(userId: string, googleSub: string): Promise<StoredUser | undefined> {
    const user = this.byId.get(userId);
    if (!user) return undefined;
    if (user.googleSub && user.googleSub !== googleSub) return undefined;
    const next = {
      ...user,
      googleSub,
      emailVerifiedAt: user.emailVerifiedAt ?? new Date().toISOString(),
    };
    return this.save(next);
  }

  async markEmailVerified(userId: string): Promise<StoredUser | undefined> {
    const user = this.byId.get(userId);
    if (!user) return undefined;
    return this.save({
      ...user,
      emailVerifiedAt: user.emailVerifiedAt ?? new Date().toISOString(),
    });
  }
}
