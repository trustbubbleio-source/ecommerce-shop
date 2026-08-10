import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  splitting: false,
  sourcemap: true,
  // Bundle workspace packages (they ship TypeScript source) into the output.
  noExternal: [/^@akknerds\//],
  external: ['@prisma/client', '.prisma/client', '@aws-sdk/client-s3'],
});
