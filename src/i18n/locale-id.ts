/**
 * The languages the interface is available in.
 *
 * A locale is the language of the app's own words: menus, headings, book names. It is not the
 * language of the Bible text, which is a property of the translation the reader has chosen (see
 * `src/translations/registry.ts`). They start out matched — a reader whose browser asks for
 * Portuguese gets a Portuguese interface and a Portuguese Bible — and are free afterwards, so
 * that a Portuguese interface can read an English text, or the other way round.
 *
 * Tags are the base language rather than a region: one set of Portuguese words serves Lisbon and
 * São Paulo, and filing them under `pt-BR` would leave European readers on English for the sake
 * of a handful of words.
 */
export const LOCALE_IDS = ['en', 'pt', 'de', 'it', 'es', 'uk', 'pl'] as const;
export type LocaleId = (typeof LOCALE_IDS)[number];

/** Whether a string from outside (a URL, a stored preference) names a locale. */
export function isLocaleId(value: string): value is LocaleId {
  return LOCALE_IDS.some((id) => id === value);
}

/**
 * The locale that best matches a list of languages a browser asks for, e.g.
 * `['pt-PT', 'en-GB']` → `pt`. Matching is on the base language, most preferred first.
 */
export function matchLocale(preferred: readonly string[]): LocaleId | null {
  for (const language of preferred) {
    const base = language.toLowerCase().split('-')[0] ?? '';
    const found = LOCALE_IDS.find((id) => id === base);
    if (found) {
      return found;
    }
  }
  return null;
}

/** The language the app falls back to, and the one its source messages are written in. */
export const DEFAULT_LOCALE_ID: LocaleId = 'en';
