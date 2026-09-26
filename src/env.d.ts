interface ImportMetaEnv {
  /** The site's name, defined once in `vite/site.ts`. */
  readonly SITE_NAME: string;
  /** The published site's address (origin and path), also on the dev server; see `vite/site.ts`. */
  readonly SITE_URL: string;
}
