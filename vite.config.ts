/// <reference types="vitest/config" />
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { analytics } from './vite/analytics.ts';
import { firstFrame } from './vite/first-frame.ts';
import { offline } from './vite/offline.ts';
import { DEPLOY_BASE, PAGES, ROOT_DIR, SITE_NAME } from './vite/site.ts';
import { siteHead } from './vite/site-head.ts';

// https://vite.dev/config/
export default defineConfig(({ command, isPreview = false }) => ({
  // The dev server runs at the root; builds, and their preview, at the deployed sub-path, so a
  // path that ignores the base breaks in `npm run preview` rather than in production. Runtime code
  // builds every URL from `import.meta.env.BASE_URL`.
  base: process.env['BASE_PATH'] ?? (command === 'build' || isPreview ? DEPLOY_BASE : '/'),
  define: { 'import.meta.env.SITE_NAME': JSON.stringify(SITE_NAME) },
  plugins: [react(), siteHead(), firstFrame(), offline(), analytics()],
  build: {
    // Three.js alone is ~550 kB minified (~140 kB gzipped); only the WebGL pages load it.
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      input: Object.fromEntries(
        Object.entries(PAGES).map(([name, { entry }]) => [name, resolve(ROOT_DIR, entry)]),
      ),
      output: {
        // Named vendor chunks: cacheable across pages and readable in the build report.
        codeSplitting: {
          groups: [
            { name: 'three', test: /node_modules[\\/]three[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
  },
}));
