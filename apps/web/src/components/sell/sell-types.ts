import { isSellCsvFile } from '@akknerds/shared';

export type SellStep = 'build' | 'review' | 'done';

export interface SellCardDraft {
  id: string;
  /** Object URL for local preview (revoked on remove). */
  previewUrl: string | null;
  /** Original image file kept until submit (jpg/png/webp only). */
  file: File | null;
  fileName: string | null;
  title: string;
  notes: string;
  condition: string;
}

export function createSellCardId(): string {
  return `card_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptySellCard(partial?: Partial<SellCardDraft>): SellCardDraft {
  return {
    id: createSellCardId(),
    previewUrl: null,
    file: null,
    fileName: null,
    title: '',
    notes: '',
    condition: '',
    ...partial,
  };
}

/** Parse a simple CSV: title, condition?, notes? (header optional). */
export function parseSellCsv(
  text: string,
): Omit<SellCardDraft, 'id' | 'previewUrl' | 'fileName' | 'file'>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const first = lines[0]!.toLowerCase();
  const hasHeader =
    first.includes('title') ||
    first.includes('name') ||
    first.includes('card') ||
    first.includes('condition');
  const rows = hasHeader ? lines.slice(1) : lines;

  return rows
    .map((line) => {
      const cols = splitCsvLine(line);
      const title = (cols[0] ?? '').trim();
      const condition = (cols[1] ?? '').trim();
      const notes = (cols[2] ?? '').trim();
      return { title, condition, notes };
    })
    .filter((row) => row.title.length > 0);
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}

export { isSellCsvFile };
