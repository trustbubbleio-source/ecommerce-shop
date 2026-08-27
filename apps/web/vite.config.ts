/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export default defineConfig({
  // Load VITE_* variables from the monorepo root `.env`.
  envDir: repoRoot,
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    target: 'es2020',
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Only split clearly independent libs. Do not split React from its
        // consumers (radix/lucide/etc) — that created vendor↔react cycles and
        // a production crash: Cannot read properties of undefined (forwardRef).
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-router')) return 'router';
          if (id.includes('@tanstack')) return 'query';
          return undefined;
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['@akknerds/ui', '@akknerds/shared', '@akknerds/chat', '@akknerds/api-client'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
    env: {
      VITE_API_URL: 'http://localhost:4000',
      VITE_ASSET_CDN_URL: 'https://cdn.test',
    },
    server: {
      deps: {
        inline: ['@akknerds/ui', '@akknerds/shared', '@akknerds/chat', '@akknerds/api-client'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
