import type { BookId } from '../core/bible/books.ts';
import type { Passage } from '../core/bible/passage.ts';
import { toOsisId } from '../core/bible/verse-ref.ts';
import type { Versification } from '../core/bible/versification.ts';

/**
 * Translations the app cannot include, offered as links to the same passage on bible.com.
 *
 * Their text is copyrighted, and the free use their publishers allow stops far short of a whole
 * Bible (the NASB's at 1,000 verses), so none of it is copied, stored or fetched here. A link names
 * a passage and nothing more, on a site the publishers license to show it; and it is a plain link,
 * so nothing is loaded from bible.com, and nothing is sent there, until a reader follows one.
 *
 * bible.com is YouVersion's reader, which carries no advertising. Its terms reserve YouVersion's
 * own marks, so the site is named in plain words, never by its logo.
 */
export interface ExternalTranslation {
  readonly id: 'esv' | 'nasb1995' | 'nlt';
  readonly name: string;
  /** What the link shows, written as the publisher writes it: `NASB 1995`, not `NASB95`. */
  readonly abbreviation: string;
  /** BCP 47 tag. A translation is offered beside a text in the same language. */
  readonly language: string;
  /** bible.com's number and code for the translation: the first and last parts of its addresses. */
  readonly bibleCom: { readonly id: number; readonly code: string };
  /**
   * Verses the KJV numbering has and this translation leaves out, as OSIS IDs. bible.com shows "No
   * Available Verses" for one of them, so its link opens the chapter instead, where the
   * translation's own footnote says what became of the verse.
   */
  readonly omits: ReadonlySet<string>;
  /**
   * Verses whose words this translation divides differently (OSIS ID → its first and last verse
   * for them), so that a link shows everything the KJV numbers as that one verse. Without this,
   * 3 John 1:14 opens on half a verse, and Philippians 1:16 on the words the KJV gives to 1:17.
   */
  readonly spans: ReadonlyMap<string, readonly [number, number]>;
}

/** The site the links open, as a reader would type it. */
export const EXTERNAL_SITE = 'bible.com';

const BIBLE_COM_BIBLE = 'https://www.bible.com/bible';

/**
 * The book codes in bible.com's addresses: USFM's, the Paratext standard.
 *
 * Not the codes the eBible importer reads (`scripts/data/importers/ebible-vpl.ts`). Those are
 * BibleWorks', and eleven of them differ — `SOL` for `SNG`, `JOH` for `JHN`, `PHI` for `PHP` —
 * so borrowing that table would send Song of Songs, John, Philippians and eight other books to
 * pages that do not exist.
 */
const USFM_BOOK_CODES: Readonly<Record<BookId, string>> = {
  Gen: 'GEN',
  Exod: 'EXO',
  Lev: 'LEV',
  Num: 'NUM',
  Deut: 'DEU',
  Josh: 'JOS',
  Judg: 'JDG',
  Ruth: 'RUT',
  '1Sam': '1SA',
  '2Sam': '2SA',
  '1Kgs': '1KI',
  '2Kgs': '2KI',
  '1Chr': '1CH',
  '2Chr': '2CH',
  Ezra: 'EZR',
  Neh: 'NEH',
  Esth: 'EST',
  Job: 'JOB',
  Ps: 'PSA',
  Prov: 'PRO',
  Eccl: 'ECC',
  Song: 'SNG',
  Isa: 'ISA',
  Jer: 'JER',
  Lam: 'LAM',
  Ezek: 'EZK',
  Dan: 'DAN',
  Hos: 'HOS',
  Joel: 'JOL',
  Amos: 'AMO',
  Obad: 'OBA',
  Jonah: 'JON',
  Mic: 'MIC',
  Nah: 'NAM',
  Hab: 'HAB',
  Zeph: 'ZEP',
  Hag: 'HAG',
  Zech: 'ZEC',
  Mal: 'MAL',
  Matt: 'MAT',
  Mark: 'MRK',
  Luke: 'LUK',
  John: 'JHN',
  Acts: 'ACT',
  Rom: 'ROM',
  '1Cor': '1CO',
  '2Cor': '2CO',
  Gal: 'GAL',
  Eph: 'EPH',
  Phil: 'PHP',
  Col: 'COL',
  '1Thess': '1TH',
  '2Thess': '2TH',
  '1Tim': '1TI',
  '2Tim': '2TI',
  Titus: 'TIT',
  Phlm: 'PHM',
  Heb: 'HEB',
  Jas: 'JAS',
  '1Pet': '1PE',
  '2Pet': '2PE',
  '1John': '1JN',
  '2John': '2JN',
  '3John': '3JN',
  Jude: 'JUD',
  Rev: 'REV',
};

/**
 * The sixteen verses the earliest manuscripts do not have, which the ESV and the NLT leave out
 * on bible.com, keeping their numbers and giving their words in a footnote.
 *
 * The data pipeline keeps a list of the same sixteen (`scripts/data/lib/omitted-verses.ts`), and
 * this one is deliberately not shared with it. That one says which blanks a bundled source file
 * may have, and is the place to grant a new one; this one says what three particular editions
 * print on another site. Sharing them would let a change to the first quietly send ESV and NLT
 * readers to a chapter page for verses those translations do print.
 */
const CRITICAL_TEXT_OMISSIONS: ReadonlySet<string> = new Set([
  'Matt.17.21',
  'Matt.18.11',
  'Matt.23.14',
  'Mark.7.16',
  'Mark.9.44',
  'Mark.9.46',
  'Mark.11.26',
  'Mark.15.28',
  'Luke.17.36',
  'Luke.23.17',
  'John.5.4',
  'Acts.8.37',
  'Acts.15.34',
  'Acts.24.7',
  'Acts.28.29',
  'Rom.16.24',
]);

/**
 * Where these three translations divide a verse differently from the KJV. They were checked on
 * bible.com at the places English Bibles are known to part company — the psalm titles, Joel and
 * Malachi, the chapter boundaries Hebrew Bibles draw elsewhere, the New Testament's divided
 * verses — and all three number their chapters and verses as the KJV does. These are the places
 * found where a KJV-numbered link would show less than the verse it names.
 */
const MODERN_SPANS: readonly (readonly [string, readonly [number, number]])[] = [
  // The KJV's one verse is two here: the hope of meeting face to face, then the greetings.
  ['3John.1.14', [14, 15]],
  // The two verses trade places, following the order of the earliest manuscripts.
  ['Phil.1.16', [16, 17]],
  ['Phil.1.17', [16, 17]],
];

/**
 * The translations, in the order the links are shown. bible.com's IDs and codes are its own, read
 * from its addresses: `bible.com/bible/59/JHN.3.16.ESV`.
 */
export const EXTERNAL_TRANSLATIONS: readonly ExternalTranslation[] = [
  {
    id: 'esv',
    name: 'English Standard Version',
    abbreviation: 'ESV',
    language: 'en',
    bibleCom: { id: 59, code: 'ESV' },
    // Matthew 12:47 too: the ESV gives it only in a footnote.
    omits: new Set([...CRITICAL_TEXT_OMISSIONS, 'Matt.12.47']),
    spans: new Map(MODERN_SPANS),
  },
  {
    id: 'nasb1995',
    name: 'New American Standard Bible 1995',
    abbreviation: 'NASB 1995',
    language: 'en',
    bibleCom: { id: 100, code: 'NASB1995' },
    // It prints every one of them, in brackets.
    omits: new Set(),
    spans: new Map(MODERN_SPANS),
  },
  {
    id: 'nlt',
    name: 'New Living Translation',
    abbreviation: 'NLT',
    language: 'en',
    bibleCom: { id: 116, code: 'NLT' },
    omits: CRITICAL_TEXT_OMISSIONS,
    // And the last clause of the KJV's 1 John 2:13, the one to the little children, opens its
    // 2:14.
    spans: new Map([...MODERN_SPANS, ['1John.2.13', [13, 14]]]),
  },
];

function baseLanguage(tag: string): string {
  return tag.toLowerCase().split('-')[0] ?? tag;
}

/**
 * The translations to offer beside a text: those in its language. A reader of an English Bible
 * is offered English ones; a reader of the Bíblia Livre is offered none yet, rather than three
 * they may not read.
 */
export function externalTranslationsFor(language: string): readonly ExternalTranslation[] {
  const base = baseLanguage(language);
  return EXTERNAL_TRANSLATIONS.filter((translation) => baseLanguage(translation.language) === base);
}

/** The passage's address on bible.com in a translation: a verse, or a whole chapter. */
export function externalPassageUrl(
  translation: ExternalTranslation,
  passage: Passage,
  versification: Versification,
): string {
  const { id, code } = translation.bibleCom;
  const site = `${BIBLE_COM_BIBLE}/${String(id)}`;
  if (passage.kind === 'chapter') {
    return `${site}/${USFM_BOOK_CODES[passage.book]}.${String(passage.chapter)}.${code}`;
  }
  const ref = versification.refAt(passage.verse);
  const chapter = `${USFM_BOOK_CODES[ref.book]}.${String(ref.chapter)}`;
  const osisId = toOsisId(ref);
  if (translation.omits.has(osisId)) {
    return `${site}/${chapter}.${code}`;
  }
  const span = translation.spans.get(osisId);
  const verses = span ? `${String(span[0])}-${String(span[1])}` : String(ref.verse);
  return `${site}/${chapter}.${verses}.${code}`;
}
