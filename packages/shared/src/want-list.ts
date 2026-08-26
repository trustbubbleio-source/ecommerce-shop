export const WANT_LIST_PRESET_IDS = [
  'singles-nm-en',
  'singles-nm-jp',
  'sealed-en',
  'sealed-jp',
  'graded-any',
  'custom',
] as const;

export type WantListPresetId = (typeof WANT_LIST_PRESET_IDS)[number];

export const WANT_LIST_PRESETS: ReadonlyArray<{
  id: WantListPresetId;
  label: string;
  /** Short chip label in the UI. */
  shortLabel: string;
  description: string;
}> = [
  {
    id: 'singles-nm-en',
    label: 'Singles · Near Mint · English',
    shortLabel: 'Singles NM EN',
    description: 'Raw singles, Near Mint, English',
  },
  {
    id: 'singles-nm-jp',
    label: 'Singles · Near Mint · Japanese',
    shortLabel: 'Singles NM JP',
    description: 'Raw singles, Near Mint, Japanese',
  },
  {
    id: 'sealed-en',
    label: 'Sealed · English',
    shortLabel: 'Sealed EN',
    description: 'Boxes, ETBs, packs — English sealed',
  },
  {
    id: 'sealed-jp',
    label: 'Sealed · Japanese',
    shortLabel: 'Sealed JP',
    description: 'Boxes, ETBs, packs — Japanese sealed',
  },
  {
    id: 'graded-any',
    label: 'Graded slabs',
    shortLabel: 'Graded',
    description: 'PSA / CGC / BGS graded cards',
  },
  {
    id: 'custom',
    label: 'Custom request',
    shortLabel: 'Custom',
    description: 'Describe exactly what you need',
  },
] as const;

export const WANT_LIST_STATUSES = [
  'pending',
  'reviewing',
  'accepted',
  'rejected',
  'found',
  'contacted',
] as const;

export type WantListStatus = (typeof WANT_LIST_STATUSES)[number];

export const WANT_LIST_STATUS_LABELS: Record<WantListStatus, string> = {
  pending: 'Pending',
  reviewing: 'Reviewing',
  accepted: 'Accepted',
  rejected: 'Rejected',
  found: 'Found',
  contacted: 'Contacted',
};

export interface WantListItem {
  id: string;
  userId: string;
  preset: WantListPresetId;
  title: string;
  notes: string;
  status: WantListStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Admin table row includes the member who submitted the request. */
export interface WantListAdminItem extends WantListItem {
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export function wantListPresetLabel(preset: WantListPresetId): string {
  return WANT_LIST_PRESETS.find((p) => p.id === preset)?.shortLabel ?? preset;
}
