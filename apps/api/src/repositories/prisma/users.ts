import { prisma } from '@akknerds/db';
import { Prisma } from '@prisma/client';
import type { SupportedCurrency, UpdateProfileInput, UserRole } from '@akknerds/shared';
import { WELCOME_DISCOUNT_CODE, normalizeCurrency } from '@akknerds/shared';
import { nanoid } from 'nanoid';
import {
  emptyProfile,
  parseShippingAddress,
  type StoredProfile,
  type StoredUser,
} from '../users.js';
import type { UserRepository } from '../interfaces.js';

type ProfileRow = {
  phone: string | null;
  country: string | null;
  city: string | null;
  bio: string | null;
  shippingAddress: Prisma.JsonValue | null;
  discountCode: string | null;
  preferredCurrency: string;
  marketingOptIn: boolean;
  updatedAt: Date;
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null;
  googleSub: string | null;
  role: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  profile: ProfileRow | null;
};

function toStoredProfile(row: ProfileRow | null | undefined): StoredProfile {
  if (!row) return emptyProfile();
  return {
    phone: row.phone,
    country: row.country,
    city: row.city,
    bio: row.bio,
    shippingAddress: parseShippingAddress(row.shippingAddress),
    discountCode: row.discountCode,
    preferredCurrency: normalizeCurrency(row.preferredCurrency),
    marketingOptIn: row.marketingOptIn,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toStored(row: UserRow): StoredUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    googleSub: row.googleSub,
    role: row.role as UserRole,
    emailVerifiedAt: row.emailVerifiedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    profile: toStoredProfile(row.profile),
  };
}

const userInclude = { profile: true } as const;

async function ensureProfile(userId: string): Promise<void> {
  await prisma.profile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });
}

export class PrismaUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<StoredUser | undefined> {
    const row = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: userInclude,
    });
    if (!row) return undefined;
    if (!row.profile) {
      await ensureProfile(row.id);
      return this.findByEmail(email);
    }
    return toStored(row);
  }

  async findById(id: string): Promise<StoredUser | undefined> {
    const row = await prisma.user.findUnique({ where: { id }, include: userInclude });
    if (!row) return undefined;
    if (!row.profile) {
      await ensureProfile(row.id);
      return this.findById(id);
    }
    return toStored(row);
  }

  async findByGoogleSub(googleSub: string): Promise<StoredUser | undefined> {
    const row = await prisma.user.findUnique({ where: { googleSub }, include: userInclude });
    if (!row) return undefined;
    if (!row.profile) {
      await ensureProfile(row.id);
      return this.findByGoogleSub(googleSub);
    }
    return toStored(row);
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
        profile: { create: { discountCode: WELCOME_DISCOUNT_CODE } },
      },
      include: userInclude,
    });
    return toStored(row);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<StoredUser | undefined> {
    try {
      const row = await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
        include: userInclude,
      });
      if (!row.profile) {
        await ensureProfile(userId);
        return this.findById(userId);
      }
      return toStored(row);
    } catch {
      return undefined;
    }
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileInput,
  ): Promise<StoredUser | undefined> {
    try {
      await ensureProfile(userId);
      const profileData: {
        phone?: string | null;
        country?: string | null;
        city?: string | null;
        bio?: string | null;
        shippingAddress?: Prisma.InputJsonValue | typeof Prisma.JsonNull;
        discountCode?: string | null;
        preferredCurrency?: SupportedCurrency;
        marketingOptIn?: boolean;
      } = {};
      if (input.phone !== undefined) profileData.phone = input.phone;
      if (input.country !== undefined) profileData.country = input.country;
      if (input.city !== undefined) profileData.city = input.city;
      if (input.bio !== undefined) profileData.bio = input.bio;
      if (input.shippingAddress !== undefined) {
        profileData.shippingAddress =
          input.shippingAddress === null
            ? Prisma.JsonNull
            : (input.shippingAddress as Prisma.InputJsonValue);
      }
      if (input.discountCode !== undefined) profileData.discountCode = input.discountCode;
      if (input.preferredCurrency !== undefined) {
        profileData.preferredCurrency = normalizeCurrency(input.preferredCurrency);
      }
      if (input.marketingOptIn !== undefined) profileData.marketingOptIn = input.marketingOptIn;

      const row = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.name !== undefined ? { name: input.name } : {}),
          profile: { update: profileData },
        },
        include: userInclude,
      });
      return toStored(row);
    } catch {
      return undefined;
    }
  }

  async linkGoogle(userId: string, googleSub: string): Promise<StoredUser | undefined> {
    const existing = await prisma.user.findUnique({ where: { id: userId }, include: userInclude });
    if (!existing) return undefined;
    if (existing.googleSub && existing.googleSub !== googleSub) return undefined;
    try {
      const row = await prisma.user.update({
        where: { id: userId },
        data: {
          googleSub,
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        },
        include: userInclude,
      });
      if (!row.profile) {
        await ensureProfile(userId);
        return this.findById(userId);
      }
      return toStored(row);
    } catch {
      return undefined;
    }
  }

  async markEmailVerified(userId: string): Promise<StoredUser | undefined> {
    try {
      const existing = await prisma.user.findUnique({ where: { id: userId }, include: userInclude });
      if (!existing) return undefined;
      if (existing.emailVerifiedAt) {
        if (!existing.profile) {
          await ensureProfile(userId);
          return this.findById(userId);
        }
        return toStored(existing);
      }
      const row = await prisma.user.update({
        where: { id: userId },
        data: { emailVerifiedAt: new Date() },
        include: userInclude,
      });
      if (!row.profile) {
        await ensureProfile(userId);
        return this.findById(userId);
      }
      return toStored(row);
    } catch {
      return undefined;
    }
  }
}
