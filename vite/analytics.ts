import type { Plugin } from 'vite';
import { atEndOfHead, pageOf } from './site.ts';

/**
 * Google Analytics (GA4): the same property as the owner's other projects on trekhleb.dev. It
 * reports only from that origin, so local previews, and forks deployed elsewhere, never send their
 * visits to it.
 */
const ANALYTICS = { id: 'G-YJ73BX984Z', origin: 'https://trekhleb.dev' };

/**
 * Adds Google Analytics to every page of production builds, the unlisted debug page included.
 * Visits within the app (passages and views change the URL with `history.pushState`) count as page
 * views through GA4's enhanced measurement of history changes.
 */
export function analytics(): Plugin {
  let building = false;
  const snippet = [
    `if (location.origin === ${JSON.stringify(ANALYTICS.origin)}) {`,
    '  window.dataLayer = window.dataLayer || [];',
    '  window.gtag = function () { window.dataLayer.push(arguments); };',
    "  window.gtag('js', new Date());",
    `  window.gtag('config', ${JSON.stringify(ANALYTICS.id)});`,
    "  const script = document.createElement('script');",
    '  script.async = true;',
    `  script.src = ${JSON.stringify(`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.id}`)};`,
    '  document.head.append(script);',
    '}',
  ].join('\n');
  return {
    name: 'bible-cross-references:analytics',
    configResolved(config) {
      building = config.command === 'build';
    },
    transformIndexHtml(_, context) {
      return building && pageOf(context.path)
        ? atEndOfHead([{ tag: 'script', children: snippet }])
        : [];
    },
  };
}
