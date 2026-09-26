import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { transformWithOxc, type Plugin } from 'vite';
import { vizDatasetPaths } from '../src/visualizations/shared/viz-datasets.ts';
import { atEndOfHead, PAGES, pageOf, ROOT_DIR, SITE_NAME } from './site.ts';

/** Files from `public/` that the offline cache keeps with each version. */
const OFFLINE_PUBLIC_FILES = [
  'favicon.svg',
  'favicon.ico',
  'apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

/** The web app manifest: installable, with paths relative to itself, so it works under any base. */
const WEB_APP_MANIFEST = {
  id: './',
  name: SITE_NAME,
  short_name: 'Cross-Refs',
  description:
    'Every cross-reference in the Bible, drawn as arcs, and every chapter with its threads.',
  start_url: './',
  scope: './',
  display: 'standalone',
  background_color: '#0d0d0d',
  theme_color: '#0d0d0d',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    {
      src: 'icons/icon-maskable-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

/**
 * Makes the built site an installable web app that works offline: writes the web app manifest
 * (linked from the app pages) and the service worker, compiled from sw/service-worker.ts with
 * this version's files and a hash of them. The app registers it (src/app/register-offline-cache.ts)
 * with the site's base as its scope. Nothing of this runs on the dev server.
 */
export function offline(): Plugin {
  let base = '/';
  let building = false;
  return {
    name: 'bible-cross-references:offline',
    configResolved(config) {
      base = config.base;
      building = config.command === 'build';
    },
    transformIndexHtml(_, context) {
      if (!building || !pageOf(context.path)?.app) {
        return [];
      }
      return atEndOfHead([
        { tag: 'link', attrs: { rel: 'manifest', href: `${base}manifest.webmanifest` } },
      ]);
    },
    async generateBundle(_, bundle) {
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.webmanifest',
        source: `${JSON.stringify(WEB_APP_MANIFEST, null, 2)}\n`,
      });
      const pages = Object.values(PAGES)
        .filter(({ app }) => app)
        .map(({ entry }) => entry.replace(/index\.html$/, ''));
      const files = Object.keys(bundle).filter(
        (fileName) => !fileName.endsWith('.html') && fileName !== 'sitemap.xml',
      );
      const version = createHash('sha256');
      for (const fileName of files.toSorted()) {
        const output = bundle[fileName];
        version.update(fileName);
        version.update(output?.type === 'chunk' ? output.code : (output?.source ?? ''));
      }
      for (const fileName of OFFLINE_PUBLIC_FILES) {
        version.update(readFileSync(resolve(ROOT_DIR, 'public', fileName)));
      }
      for (const { entry } of Object.values(PAGES)) {
        version.update(readFileSync(resolve(ROOT_DIR, entry)));
      }
      const worker = await transformWithOxc(
        readFileSync(resolve(ROOT_DIR, 'sw/service-worker.ts'), 'utf8'),
        'service-worker.ts',
        { lang: 'ts' },
      );
      const injected = [
        `const PRECACHE = ${JSON.stringify([...pages, ...files, ...OFFLINE_PUBLIC_FILES])};`,
        `const DATASETS = ${JSON.stringify(vizDatasetPaths())};`,
        `const VERSION = ${JSON.stringify(version.digest('hex').slice(0, 16))};`,
      ].join('\n');
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: `${injected}\n${worker.code}` });
    },
  };
}
