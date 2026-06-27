import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  splitting: false,
  sourcemap: true,
  // Bundle the workspace package (it ships TypeScript source) into the output.
  noExternal: [/^@akknerds\//],
});
