import type { HtmlTagDescriptor, Plugin } from 'vite';
import { vizDatasetPaths } from '../src/visualizations/shared/viz-datasets.ts';
import {
  atEndOfHead,
  AUTHOR,
  PAGES,
  pageOf,
  pageUrl,
  SITE_NAME,
  SITE_ORIGIN,
  SOCIAL_IMAGE,
} from './site.ts';

/**
 * Completes every page's head: icons and theme color; for listed pages, the canonical URL, Open
 * Graph and Twitter card tags (from the page's own title and description) and, on the home page,
 * structured data; for unlisted pages, `noindex`. Also writes `sitemap.xml` with the listed pages.
 */
export function siteHead(): Plugin {
  let base = '/';
  return {
    name: 'bible-cross-references:site-head',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml(html, context) {
      const tags: HtmlTagDescriptor[] = [
        { tag: 'link', attrs: { rel: 'icon', href: `${base}favicon.ico`, sizes: '32x32' } },
        { tag: 'link', attrs: { rel: 'icon', href: `${base}favicon.svg`, type: 'image/svg+xml' } },
        { tag: 'link', attrs: { rel: 'apple-touch-icon', href: `${base}apple-touch-icon.png` } },
        { tag: 'meta', attrs: { name: 'theme-color', content: '#0d0d0d' } },
      ];
      // The datasets start downloading with the page instead of after the scripts have run. Not
      // when the offline cache serves the page: it has them already, and Chrome can't hand a
      // preload over to the app's own request through a service worker (it would read them twice).
      const datasets = JSON.stringify(vizDatasetPaths().map((path) => `${base}${path}`));
      tags.push({
        tag: 'script',
        children:
          `if (!navigator.serviceWorker?.controller) for (const href of ${datasets}) {` +
          " const link = document.createElement('link'); link.rel = 'preload'; link.as = 'fetch';" +
          " link.crossOrigin = 'anonymous'; link.href = href; document.head.append(link); }",
      });
      const page = pageOf(context.path);
      if (!page?.listed) {
        tags.push({ tag: 'meta', attrs: { name: 'robots', content: 'noindex' } });
        return atEndOfHead(tags);
      }
      const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? SITE_NAME;
      const description = /<meta\s+name="description"\s+content="([^"]*)"/.exec(html)?.[1] ?? '';
      const url = pageUrl(page, base);
      const image = new URL(`${base}${SOCIAL_IMAGE.file}`, SITE_ORIGIN).href;
      const meta = (
        key: 'name' | 'property',
        name: string,
        content: string,
      ): HtmlTagDescriptor => ({
        tag: 'meta',
        attrs: { [key]: name, content },
      });
      tags.push(
        { tag: 'link', attrs: { rel: 'canonical', href: url } },
        meta('name', 'author', AUTHOR.name),
        meta('property', 'og:type', 'website'),
        meta('property', 'og:site_name', SITE_NAME),
        meta('property', 'og:locale', 'en_US'),
        meta('property', 'og:title', title),
        meta('property', 'og:description', description),
        meta('property', 'og:url', url),
        meta('property', 'og:image', image),
        meta('property', 'og:image:width', String(SOCIAL_IMAGE.width)),
        meta('property', 'og:image:height', String(SOCIAL_IMAGE.height)),
        meta('property', 'og:image:alt', SOCIAL_IMAGE.alt),
        meta('name', 'twitter:card', 'summary_large_image'),
        meta('name', 'twitter:creator', AUTHOR.twitter),
        meta('name', 'twitter:title', title),
        meta('name', 'twitter:description', description),
        meta('name', 'twitter:image', image),
        meta('name', 'twitter:image:alt', SOCIAL_IMAGE.alt),
      );
      if (page === PAGES.main) {
        const structuredData = {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: SITE_NAME,
          url,
          description,
          image,
          applicationCategory: 'ReferenceApplication',
          operatingSystem: 'Any',
          browserRequirements: 'Requires JavaScript and WebGL 2',
          isAccessibleForFree: true,
          inLanguage: 'en',
          author: { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url },
        };
        tags.push({
          tag: 'script',
          attrs: { type: 'application/ld+json' },
          children: JSON.stringify(structuredData),
        });
      }
      return atEndOfHead(tags);
    },
    generateBundle() {
      const urls = Object.values(PAGES)
        .filter(({ listed }) => listed)
        .map((page) => `  <url><loc>${pageUrl(page, base)}</loc></url>`);
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls,
          '</urlset>',
          '',
        ].join('\n'),
      });
    },
  };
}
