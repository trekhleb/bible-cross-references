import type { TranslationId } from '../core/datasets/ids.ts';
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
};

/** The translation shown when the user has not picked one. */
export const DEFAULT_TRANSLATION_ID: TranslationId = 'bsb';

export function getTranslationManifest(id: TranslationId): TranslationManifest {
  return TRANSLATIONS[id];
}
