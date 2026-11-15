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
    license: { name: 'Public domain', url: 'https://berean.bible/terms.htm', publicDomain: true },
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
      publicDomain: true,
    },
    // The United Kingdom is the exception to "public domain", and the app says so wherever the
    // translation is chosen: rights there are a perpetual royal patent, not an expiring copyright.
    attribution:
      'Scripture text: King James Version (Authorized Version), the 1769 text. Public domain in ' +
      'the United States and most of the world; in the United Kingdom, letters patent reserve ' +
      'the right to print it to the Crown’s patentees — Cambridge University Press, Oxford ' +
      'University Press and Collins.',
    homepage: 'https://ebible.org/Scriptures/details.php?id=eng-kjv2006',
    access: 'bundled',
  },
  blivre: {
    id: 'blivre',
    name: 'Bíblia Livre',
    abbreviation: 'BLIVRE',
    language: 'pt-BR',
    direction: 'ltr',
    versification: 'kjv',
    license: {
      name: 'CC BY 3.0 BR',
      url: 'https://creativecommons.org/licenses/by/3.0/br/',
    },
    // CC BY asks for the authors, the licence, the URI the licensor designated and a note
    // that the material was changed. The edition date is included because the translators
    // ask for it: the work is ongoing.
    attribution:
      'Scripture text: Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio and Marco Teles, ' +
      'February 2018 (Textus Receptus edition), https://sites.google.com/site/biblialivre/. ' +
      'Changed: whitespace was normalized; no word was altered.',
    homepage: 'https://sites.google.com/site/biblialivre/',
    access: 'bundled',
  },
  luther1912: {
    id: 'luther1912',
    name: 'Lutherbibel 1912',
    // The three letters German Bible software has used for this text for decades. The year is
    // carried by the name and the id, because `LUT` alone would equally name the 1545, the 1984
    // and the 2017 — and only one of those is free to publish.
    abbreviation: 'LUT',
    language: 'de',
    direction: 'ltr',
    versification: 'kjv',
    license: {
      name: 'Public domain',
      url: 'https://ebible.org/Scriptures/details.php?id=deu1912',
      publicDomain: true,
    },
    attribution:
      'Scripture text: Lutherbibel 1912 (LUT), the 1912 revision of Martin Luther’s German ' +
      'translation. Public domain. Changed: the edition’s own verse numbers were taken out of ' +
      '358 verses and a corrupt token out of Judges 11:25; no word was altered.',
    homepage: 'https://ebible.org/Scriptures/details.php?id=deu1912',
    access: 'bundled',
  },
  riveduta1927: {
    id: 'riveduta1927',
    name: 'Riveduta 1927',
    abbreviation: 'RIV',
    language: 'it',
    direction: 'ltr',
    versification: 'kjv',
    license: {
      name: 'Public domain',
      url: 'https://ebible.org/Scriptures/details.php?id=ita1927',
      publicDomain: true,
    },
    // "under", not "of": Luzzi chaired the revision commission rather than translating it alone,
    // and he separately finished a translation of his own, so "the translation of Giovanni Luzzi"
    // would name a different book. The year is here because it is the only thing separating this
    // from the Nuova Riveduta, a 1994 revision that is still in copyright.
    attribution:
      'Scripture text: Riveduta 1927 (RIV), the Italian revision made under Giovanni Luzzi. ' +
      'Public domain. Changed: the edition’s own verse numbers were taken out of 228 verses, ' +
      'a running head out of three and a stray character out of 2 Samuel 20:26; no word was ' +
      'altered.',
    homepage: 'https://ebible.org/Scriptures/details.php?id=ita1927',
    access: 'bundled',
  },
  vbl: {
    id: 'vbl',
    name: 'Versión Biblia Libre',
    // No year, where the other two carry one: a year is there to separate a text from a revision
    // that is not free (Luther 1984 and 2017, the Nuova Riveduta). Nothing is confusable with
    // this one, and it is a living translation rather than a fixed edition.
    abbreviation: 'VBL',
    language: 'es',
    direction: 'ltr',
    versification: 'kjv',
    license: {
      name: 'CC BY-SA 4.0',
      url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
    // CC BY-SA asks for the authors, the licence, a link to it and a note that the material was
    // changed. The one change is a space, which §2(a)(4) puts outside "Adapted Material"
    // altogether — but it is recorded anyway, because a credit that lists what was done to a
    // text is worth more than one that lists only what the licence compels.
    attribution:
      'Scripture text: Versión Biblia Libre (VBL), © 2018–2020 Jonathan Gallagher y Shelly ' +
      'Barrios de Avila, with Gustavo Sanabria and Rebekah Põldaas, ' +
      'https://ebible.org/Scriptures/details.php?id=spavbl, licensed under CC BY-SA 4.0. ' +
      'Changed: a space before a colon was moved in one verse; no word was altered.',
    homepage: 'https://ebible.org/Scriptures/details.php?id=spavbl',
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
      'Slovenian text: Chráska 1914, public-domain source digitized by dLib.si. OCR errors corrected for this app.',
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
