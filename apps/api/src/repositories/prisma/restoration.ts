import { prisma } from '@akknerds/db';
import type {
  RestorationPackageId,
  RestorationPhoto,
  RestorationSubmission,
  RestorationSubmissionStatus,
} from '@akknerds/shared';
import type { Prisma } from '@prisma/client';
import type {
  CreateRestorationSubmissionInput,
  RestorationSubmissionRepository as IRestorationSubmissionRepository,
} from '../interfaces.js';

function parsePhotos(value: unknown): RestorationPhoto[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is RestorationPhoto =>
      Boolean(item) &&
      typeof item === 'object' &&
      typeof (item as RestorationPhoto).slot === 'string' &&
      typeof (item as RestorationPhoto).key === 'string',
  );
}

function toPublic(row: {
  id: string;
  email: string;
  notes: string;
  packageInterest: string;
  photos: unknown;
  status: string;
  adminNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}): RestorationSubmission {
  return {
    id: row.id,
    email: row.email,
    notes: row.notes,
    packageInterest: row.packageInterest as RestorationPackageId,
    photos: parsePhotos(row.photos),
    status: row.status as RestorationSubmissionStatus,
    adminNote: row.adminNote,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export class PrismaRestorationSubmissionRepository implements IRestorationSubmissionRepository {
  async create(input: CreateRestorationSubmissionInput): Promise<RestorationSubmission> {
    const row = await prisma.restorationSubmission.create({
      data: {
        email: input.email,
        notes: input.notes,
        packageInterest: input.packageInterest,
        photos: input.photos as unknown as Prisma.InputJsonValue,
        status: 'new',
      },
    });
    return toPublic(row);
  }

  async listAll(): Promise<RestorationSubmission[]> {
    const rows = await prisma.restorationSubmission.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toPublic);
  }

  async updateStatus(
    id: string,
    input: { status: RestorationSubmissionStatus; adminNote?: string | null },
  ): Promise<RestorationSubmission | undefined> {
    try {
      const row = await prisma.restorationSubmission.update({
        where: { id },
        data: {
          status: input.status,
          ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
        },
      });
      return toPublic(row);
    } catch {
      return undefined;
    }
  }
}
