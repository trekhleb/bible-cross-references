import { TRANSLATION_IDS, type TranslationId } from '../core/datasets/ids.ts';
import { expectOneOf } from '../core/lib/validation.ts';
import type { TranslationManifest } from './translation-manifest.ts';

const TRANSLATIONS: Readonly<Record<TranslationId, TranslationManifest>> = {
  bsb: {
    id: 'bsb',
    name: 'Berean Standard Bible',
    abbreviation: 'BSB',
    language: 'en',
    direction: 'ltr',
    versification: 'kjv',
    license: { name: 'Public domain', url: 'https://berean.bible/terms.htm' },
    attribution: 'Scripture text: Berean Standard Bible (BSB), dedicated to the public domain.',
    homepage: 'https://berean.bible/',
    access: 'bundled',
  },
  // Copyrighted: its text comes from a local file that is never committed (see data/raw/README.md),
  // and a site built with it is for private use only.
  esv: {
    id: 'esv',
    name: 'English Standard Version',
    abbreviation: 'ESV',
    language: 'en',
    direction: 'ltr',
    versification: 'kjv',
    license: { name: '© Crossway', url: 'https://www.crossway.org/permissions/' },
    attribution:
      'Scripture text: ESV® Bible (The Holy Bible, English Standard Version®), © 2001 by ' +
      'Crossway, a publishing ministry of Good News Publishers. All rights reserved.',
    homepage: 'https://www.esv.org/',
    access: 'bundled',
  },
};

/** The translation shown when the build does not pick one with `TRANSLATION`. */
export const DEFAULT_TRANSLATION_ID: TranslationId = 'bsb';

/** The translation picked by the `TRANSLATION` build variable (e.g. `esv`), or the default. */
export function parseTranslationId(value: string | undefined): TranslationId {
  return value === undefined || value === ''
    ? DEFAULT_TRANSLATION_ID
    : expectOneOf(value.toLowerCase(), TRANSLATION_IDS, 'TRANSLATION');
}

export function getTranslationManifest(id: TranslationId): TranslationManifest {
  return TRANSLATIONS[id];
}
