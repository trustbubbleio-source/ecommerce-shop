/** Stable Prisma enum member name for a human-readable label (shared with db codegen). */
export function toPrismaEnumKey(label: string): string {
  if (label === '151') return 'set_151';

  let key = label
    .normalize('NFKD')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/'/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

  if (/^\d/.test(key)) key = `n_${key}`;
  return key;
}
