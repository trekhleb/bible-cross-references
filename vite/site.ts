import { resolve } from 'node:path';
import type { HtmlTagDescriptor } from 'vite';

/**
 * Facts about the site that the build uses: its name, where it is served, its pages, and the
 * helpers the plugins in this folder share.
 */

/** The project's root directory. */
export const ROOT_DIR = resolve(import.meta.dirname, '..');

/** The site's name: `import.meta.env.SITE_NAME` in code, `%SITE_NAME%` in the HTML entries. */
export const SITE_NAME = 'Bible Cross-References';

/**
 * Where the built site is served. GitHub Pages serves this repository (bible-cross-references) at
 * trekhleb.dev/bible-cross-references/, under the owner's custom domain. Set `BASE_PATH` and
 * `SITE_ORIGIN` to build for another location, e.g. `BASE_PATH=/` for the root of a domain.
 */
export const DEPLOY_BASE = '/bible-cross-references/';
export const SITE_ORIGIN = process.env['SITE_ORIGIN'] ?? 'https://trekhleb.dev';
/**
 * The published site, e.g. `https://trekhleb.dev/bible-cross-references/`. Links meant for others
 * (copied quotes) point here even from the dev server, which runs at the root.
 */
export const SITE_URL = new URL(process.env['BASE_PATH'] ?? DEPLOY_BASE, SITE_ORIGIN).href;

export const AUTHOR = {
  name: 'Oleksii Trekhleb',
  url: 'https://trekhleb.dev',
  twitter: '@Trekhleb',
};

/**
 * The picture shown when a page is shared (Open Graph and Twitter cards), in `public/`: twice the
 * usual 1200×630, so it stays sharp on high-density screens after platforms scale it down.
 */
export const SOCIAL_IMAGE = {
  file: 'social-preview.jpg',
  width: 2400,
  height: 1260,
  alt: 'Arcs connecting the verses of the Bible, from Genesis to Revelation, colored by genre',
};

/**
 * The site's pages. The home page and `threads/` are the same app (src/app/views.ts), each with its
 * own HTML file so that links straight into either view work on a static host. Each HTML file
 * declares its title and description; `siteHead()` adds everything else. Unlisted pages stay out of
 * search engines and the sitemap. App pages are the installable app (`offline()`); every page gets
 * the instant first frame (`firstFrame()`).
 */
export const PAGES = {
  main: { entry: 'index.html', listed: true, app: true },
  threads: { entry: 'threads/index.html', listed: true, app: true },
  debug: { entry: 'debug/index.html', listed: false, app: false },
} as const;

export type Page = (typeof PAGES)[keyof typeof PAGES];

/** The page an HTML transform is working on, from its public path (e.g. `/threads/index.html`). */
export function pageOf(path: string): Page | undefined {
  return Object.values(PAGES).find(({ entry }) => `/${entry}` === path);
}

/** The public URL of a page, e.g. `https://trekhleb.dev/bible-cross-references/threads/`. */
export function pageUrl(page: Page, base: string): string {
  return new URL(`${base}${page.entry.replace(/index\.html$/, '')}`, SITE_ORIGIN).href;
}

/** Places tags after the page's own, so `<meta charset>` stays first in the head, as it must. */
export function atEndOfHead(tags: readonly HtmlTagDescriptor[]): HtmlTagDescriptor[] {
  return tags.map((tag) => ({ ...tag, injectTo: 'head' }));
}
