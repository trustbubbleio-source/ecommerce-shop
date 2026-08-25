import type {
  Address,
  SupportedCurrency,
  UpdateProfileInput,
  UserProfile,
  UserRole,
} from '@akknerds/shared';
import { WELCOME_DISCOUNT_CODE, addressSchema, normalizeCurrency } from '@akknerds/shared';
import { nanoid } from 'nanoid';
import type { UserRepository as IUserRepository } from './interfaces.js';

export interface StoredProfile {
  phone: string | null;
  country: string | null;
  city: string | null;
  bio: string | null;
  shippingAddress: Address | null;
  discountCode: string | null;
  preferredCurrency: SupportedCurrency;
  marketingOptIn: boolean;
  updatedAt: string;
}

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  googleSub: string | null;
  role: UserRole;
  emailVerifiedAt: string | null;
  createdAt: string;
  profile: StoredProfile;
}

export function emptyProfile(now = new Date().toISOString()): StoredProfile {
  return {
    phone: null,
    country: null,
    city: null,
    bio: null,
    shippingAddress: null,
    discountCode: null,
    preferredCurrency: 'eur',
    marketingOptIn: false,
    updatedAt: now,
  };
}

export function parseShippingAddress(value: unknown): Address | null {
  if (value == null) return null;
  const parsed = addressSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function toPublicProfile(profile: StoredProfile): UserProfile {
  return { ...profile };
}

export function toPublicUser(user: StoredUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    emailVerifiedAt: user.emailVerifiedAt,
    hasPassword: Boolean(user.passwordHash),
    profile: toPublicProfile(user.profile),
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
    const now = new Date().toISOString();
    const user: StoredUser = {
      id: `usr_${nanoid(16)}`,
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash: input.passwordHash ?? null,
      googleSub: input.googleSub ?? null,
      role: input.role ?? 'customer',
      emailVerifiedAt: input.emailVerifiedAt ?? null,
      createdAt: now,
      profile: {
        ...emptyProfile(now),
        discountCode: WELCOME_DISCOUNT_CODE,
      },
    };
    return this.save(user);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<StoredUser | undefined> {
    const user = this.byId.get(userId);
    if (!user) return undefined;
    return this.save({ ...user, passwordHash });
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<StoredUser | undefined> {
    const user = this.byId.get(userId);
    if (!user) return undefined;
    const nextProfile: StoredProfile = {
      ...user.profile,
      phone: input.phone !== undefined ? input.phone : user.profile.phone,
      country: input.country !== undefined ? input.country : user.profile.country,
      city: input.city !== undefined ? input.city : user.profile.city,
      bio: input.bio !== undefined ? input.bio : user.profile.bio,
      shippingAddress:
        input.shippingAddress !== undefined
          ? input.shippingAddress
          : user.profile.shippingAddress,
      discountCode:
        input.discountCode !== undefined ? input.discountCode : user.profile.discountCode,
      preferredCurrency:
        input.preferredCurrency !== undefined
          ? normalizeCurrency(input.preferredCurrency)
          : user.profile.preferredCurrency,
      marketingOptIn:
        input.marketingOptIn !== undefined
          ? input.marketingOptIn
          : user.profile.marketingOptIn,
      updatedAt: new Date().toISOString(),
    };
    return this.save({
      ...user,
      name: input.name !== undefined ? input.name : user.name,
      profile: nextProfile,
    });
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
