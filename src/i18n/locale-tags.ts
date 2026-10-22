import type { LocaleId } from './locale-id.ts';

/**
 * Each language's BCP 47 tag and its name in itself.
 *
 * Kept apart from `registry.ts`, which assembles the whole locale — messages, book names and the
 * install guide's JSX. The build needs these two facts to decide which Bible to preload before
 * any of the app runs, and a plugin should not have to pull a React tree in to read them.
 */
export const LOCALE_TAGS: Readonly<
  Record<LocaleId, { readonly tag: string; readonly endonym: string }>
> = {
  en: { tag: 'en', endonym: 'English' },
  pt: { tag: 'pt-BR', endonym: 'Português' },
  de: { tag: 'de', endonym: 'Deutsch' },
  it: { tag: 'it', endonym: 'Italiano' },
  es: { tag: 'es', endonym: 'Español' },
  sl: { tag: 'sl', endonym: 'Slovenščina' },
  uk: { tag: 'uk', endonym: 'Українська' },
};
