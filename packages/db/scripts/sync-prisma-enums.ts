/**
 * Regenerates Prisma ProductSeries/ProductSet enums from SERIES_SET_MAP.
 * Run: pnpm --filter @akknerds/db sync:enums
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCT_SERIES, PRODUCT_SETS } from '@akknerds/shared';
import { toPrismaEnumKey } from '@akknerds/shared';

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function prismaEnumBlock(enumName: string, labels: readonly string[]): string {
  const lines = labels.map((label) => {
    const key = toPrismaEnumKey(label);
    if (key === label) return `  ${key}`;
    return `  ${key} @map("${label.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
  });
  return `enum ${enumName} {\n${lines.join('\n')}\n}`;
}

const schemaPath = join(root, 'packages/db/prisma/schema.prisma');
let schema = readFileSync(schemaPath, 'utf8');

schema = schema.replace(
  /enum ProductSeries \{[\s\S]*?\}\n/,
  `${prismaEnumBlock('ProductSeries', PRODUCT_SERIES)}\n\n`,
);
schema = schema.replace(
  /enum ProductSet \{[\s\S]*?\}\n/,
  `${prismaEnumBlock('ProductSet', PRODUCT_SETS)}\n\n`,
);

writeFileSync(schemaPath, schema);

console.log(`Updated schema (${PRODUCT_SERIES.length} series, ${PRODUCT_SETS.length} sets)`);
console.log(
  'If Postgres is missing new enum values, add a migration under prisma/migrations/ then run pnpm db:migrate.',
);

const dbRoot = join(root, 'packages/db');
execSync('pnpm exec prisma generate', { cwd: dbRoot, stdio: 'inherit' });
console.log('Prisma client regenerated.');
