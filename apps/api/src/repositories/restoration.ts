import type {
  RestorationPackageId,
  RestorationPhoto,
  RestorationSubmission,
  RestorationSubmissionStatus,
} from '@akknerds/shared';
import { nanoid } from 'nanoid';
import type {
  CreateRestorationSubmissionInput,
  RestorationSubmissionRepository as IRestorationSubmissionRepository,
} from './interfaces.js';

/** In-memory restoration submissions, isolated per app instance. */
export class RestorationSubmissionRepository implements IRestorationSubmissionRepository {
  private readonly items: RestorationSubmission[] = [];

  async create(input: CreateRestorationSubmissionInput): Promise<RestorationSubmission> {
    const now = new Date().toISOString();
    const row: RestorationSubmission = {
      id: `rest_${nanoid(16)}`,
      email: input.email,
      notes: input.notes,
      packageInterest: input.packageInterest,
      photos: input.photos,
      status: 'new',
      adminNote: null,
      createdAt: now,
      updatedAt: now,
    };
    this.items.unshift(row);
    return { ...row, photos: [...row.photos] };
  }

  async listAll(): Promise<RestorationSubmission[]> {
    return this.items.map((row) => ({ ...row, photos: [...row.photos] }));
  }

  async updateStatus(
    id: string,
    input: { status: RestorationSubmissionStatus; adminNote?: string | null },
  ): Promise<RestorationSubmission | undefined> {
    const row = this.items.find((item) => item.id === id);
    if (!row) return undefined;
    row.status = input.status;
    if (input.adminNote !== undefined) row.adminNote = input.adminNote;
    row.updatedAt = new Date().toISOString();
    return { ...row, photos: [...row.photos] };
  }
}

export type { RestorationPackageId, RestorationPhoto };
