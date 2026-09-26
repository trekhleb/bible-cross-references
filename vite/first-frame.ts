import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { atEndOfHead, pageOf, ROOT_DIR, SITE_NAME } from './site.ts';

/** The logo's strokes (two arcs over a baseline), read from the favicon, its single source. */
const LOGO_PATHS = [
  ...readFileSync(resolve(ROOT_DIR, 'public/favicon.svg'), 'utf8').matchAll(/\sd="([^"]+)"/g),
].map((match) => match[1] ?? '');

/** Styles for the first frame, inlined so that it needs no stylesheet or script. */
const FIRST_FRAME_CSS = `
html{background:#0d0d0d;color-scheme:dark}
body{margin:0}
.first-frame{position:fixed;inset:0;display:grid;place-content:center;justify-items:center;gap:18px;color:#ecebe6;font:500 19px/1.3 'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif}
.first-frame svg{width:76px;height:76px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round}
.first-frame .arc{stroke-dasharray:1;animation:first-frame-draw 2s ease-in-out infinite}
.first-frame .arc+.arc{animation-delay:.3s}
@keyframes first-frame-draw{0%{stroke-dashoffset:1}45%,65%{stroke-dashoffset:0}100%{stroke-dashoffset:-1}}
@media (prefers-reduced-motion:reduce){.first-frame .arc{animation:none}}
noscript{position:fixed;inset-inline:0;bottom:32px;padding:0 24px;color:#9a9890;font:14px/1.5 system-ui,sans-serif;text-align:center}
`.trim();

/**
 * Makes every page's first frame instant: before any stylesheet or script arrives, the page is
 * already dark and shows the logo, its arcs drawing themselves (in CSS). React replaces it with
 * the animated loading screen, and then with the app.
 *
 * The page's stylesheets move to the end of `<body>`, where browsers paint the content above them
 * first; the scripts still wait for them, so nothing renders unstyled.
 */
export function firstFrame(): Plugin {
  const root = '<div id="root"></div>';
  return {
    name: 'bible-cross-references:first-frame',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (!pageOf(context.path)) {
          return html;
        }
        if (!html.includes(root)) {
          throw new Error(
            `${context.path}: expected an empty ${root} to fill with the first frame.`,
          );
        }
        const [arc = '', innerArc = '', baseline = ''] = LOGO_PATHS;
        const logo =
          `<svg viewBox="0 0 32 32" aria-hidden="true"><path class="arc" pathLength="1" d="${arc}"/>` +
          `<path class="arc" pathLength="1" d="${innerArc}"/><path d="${baseline}"/></svg>`;
        const stylesheets: string[] = [];
        const withoutStylesheets = html.replace(/\s*<link rel="stylesheet"[^>]*>/g, (link) => {
          stylesheets.push(link.trim());
          return '';
        });
        return {
          html: withoutStylesheets
            .replace(
              root,
              `<div id="root"><div class="first-frame">${logo}${SITE_NAME}</div></div>`,
            )
            .replace('</body>', `${stylesheets.map((link) => `  ${link}\n`).join('')}</body>`),
          tags: atEndOfHead([
            { tag: 'meta', attrs: { name: 'color-scheme', content: 'dark' } },
            { tag: 'style', children: FIRST_FRAME_CSS },
          ]),
        };
      },
    },
  };
}
