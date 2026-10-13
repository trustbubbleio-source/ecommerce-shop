import { z } from 'zod';

export const RESTORATION_PHOTO_SLOTS = ['front', 'back', 'closeup'] as const;
export type RestorationPhotoSlot = (typeof RESTORATION_PHOTO_SLOTS)[number];

export const RESTORATION_PHOTO_SLOT_LABELS: Record<RestorationPhotoSlot, string> = {
  front: 'Front',
  back: 'Back',
  closeup: 'Close-up',
};

export const RESTORATION_PACKAGE_IDS = [
  'surface-clean',
  'clean-prep',
  'restore-press',
  'unsure',
] as const;
export type RestorationPackageId = (typeof RESTORATION_PACKAGE_IDS)[number];

export const RESTORATION_PACKAGE_LABELS: Record<RestorationPackageId, string> = {
  'surface-clean': 'Surface Clean',
  'clean-prep': 'Clean & Prep',
  'restore-press': 'Restore & Press',
  unsure: 'Not sure yet',
};

export const RESTORATION_STATUSES = ['new', 'reviewing', 'quoted', 'closed'] as const;
export type RestorationSubmissionStatus = (typeof RESTORATION_STATUSES)[number];

export const RESTORATION_STATUS_LABELS: Record<RestorationSubmissionStatus, string> = {
  new: 'New',
  reviewing: 'Reviewing',
  quoted: 'Quoted',
  closed: 'Closed',
};

/** Reuse sell image limits for restoration uploads. */
export const RESTORATION_MAX_PHOTOS = 3;
export const RESTORATION_MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const RESTORATION_MAX_TOTAL_IMAGE_BYTES = 15 * 1024 * 1024;
export const RESTORATION_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

export interface RestorationPhoto {
  slot: RestorationPhotoSlot;
  /** S3 object key, absolute URL, or data URL for local/memory mode. */
  key: string;
}

export interface RestorationSubmission {
  id: string;
  email: string;
  notes: string;
  packageInterest: RestorationPackageId;
  photos: RestorationPhoto[];
  status: RestorationSubmissionStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Admin list row with resolved image URLs for display. */
export interface RestorationSubmissionAdmin extends RestorationSubmission {
  photos: Array<RestorationPhoto & { url: string }>;
}

export const restorationSubmissionInputSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('A valid email is required')
    .max(200),
  notes: z.string().trim().max(2000).optional().default(''),
  packageInterest: z.enum(RESTORATION_PACKAGE_IDS).optional().default('unsure'),
});

export const updateRestorationStatusSchema = z.object({
  status: z.enum(RESTORATION_STATUSES),
  adminNote: z.string().trim().max(1000).nullable().optional(),
});

export type RestorationSubmissionInput = z.infer<typeof restorationSubmissionInputSchema>;
export type UpdateRestorationStatusInput = z.infer<typeof updateRestorationStatusSchema>;
