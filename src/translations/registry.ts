import type { TranslationId } from '../core/datasets/ids.ts';
import type { TranslationManifest } from './translation-manifest.ts';

export const TRANSLATIONS: Readonly<Record<TranslationId, TranslationManifest>> = {
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
  kjv: {
    id: 'kjv',
    name: 'King James Version',
    abbreviation: 'KJV',
    language: 'en',
    direction: 'ltr',
    versification: 'kjv',
    license: {
      name: 'Public domain',
      url: 'https://ebible.org/Scriptures/details.php?id=eng-kjv2006',
    },
    // The United Kingdom is the exception to "public domain", and the app says so wherever the
    // translation is chosen: rights there are a perpetual royal patent, not an expiring copyright.
    attribution:
      'Scripture text: King James Version (Authorized Version), the 1769 text. Public domain in ' +
      'the United States and most of the world; in the United Kingdom rights are vested in the ' +
      'Crown and administered by the Crown’s patentee, Cambridge University Press.',
    homepage: 'https://ebible.org/Scriptures/details.php?id=eng-kjv2006',
    access: 'bundled',
  },
  'chr1914-sl': {
    id: 'chr1914-sl',
    name: 'Chráska 1914',
    abbreviation: 'CHR',
    language: 'sl',
    direction: 'ltr',
    versification: 'kjv',
    license: {
      name: 'Local OCR preview; distribution status unverified',
      url: 'https://www.dlib.si/',
    },
    attribution:
      'Slovenian text: Chráska (1914), public-domain source digitized by dLib.si. OCR errors corrected for this app.',
    homepage: 'https://www.dlib.si/details/URN%3ANBN%3ASI%3Adoc-ME2U9X4P',
    access: 'bundled',
    previewVerseCount: 31102,
    previewNotice:
      'Slovenian draft · 31,102 of 31,102 verses available. Unresolved verses are marked. Text is still being reviewed.',
    emptyVerseNote: 'Besedilo še ni pripravljeno — preverjanje OCR in številčenja še poteka.',
  },
};

/** Every translation the app can show, in the order the picker lists them. */
export const TRANSLATION_MANIFESTS: readonly TranslationManifest[] = Object.values(TRANSLATIONS);

/** The translation shown when the user has not picked one. */
export const DEFAULT_TRANSLATION_ID: TranslationId = 'bsb';

export function getTranslationManifest(id: TranslationId): TranslationManifest {
  return TRANSLATIONS[id];
}
