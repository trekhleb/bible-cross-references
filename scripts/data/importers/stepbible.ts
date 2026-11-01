import { BOOKS, type BookId } from '../../../src/core/bible/books.ts';
import type { LicenseInfo } from '../../../src/core/datasets/metadata.ts';
import type { VerseIndex } from '../../../src/core/bible/verse-ref.ts';
import { CANONICAL_VERSIFICATION } from '../../../src/core/bible/versification.ts';
import {
  DATASET_SCHEMA_VERSION,
  type DatasetProvenance,
  type ImportNotice,
  type OriginalWordsFile,
  type WordOccurrencesFile,
} from '../../../src/core/datasets/formats.ts';
import { stripByteOrderMark } from '../lib/files.ts';
import { createNotice } from '../lib/notices.ts';

/**
 * Importer for the STEPBible tagged texts (https://github.com/STEPBible/STEPBible-Data): TAHOT
 * for the Hebrew Old Testament, TAGNT for the Greek New Testament, with the TBESH and TBESG
 * lexicons for the dictionary forms.
 *
 * Words that only some editions carry are counted like the rest. The marker after a word's
 * number says which editions have it (`=NKO`, `=K` for the text behind the KJV alone, `=L` or
 * `=Q` for the Hebrew's written and spoken forms), and none of them is read: this project counts
 * in KJV verses, so a word the KJV translators had is a word of that verse.
 *
 * What it takes from them is deliberately narrow: for every verse, which dictionary words it
 * uses, and for every word, how it is spelled, said and translated. The text of the verse in its
 * original language is never read or written — the Greek of TAGNT follows NA27/NA28, which is a
 * copyrighted critical edition, while a Strong's number is from an 1890 concordance and the
 * tagging is Tyndale's own work, published CC BY 4.0.
 *
 * Both formats are tab-separated, one word per line:
 *
 *     Luk.5.6#01=NKO   καὶ (kai)   And   G2532=CONJ   καί=and   NA28+NA27+…
 *     Gen.1.1#01=L     בְּ/רֵאשִׁ֖ית   be./re.Shit   in/ beginning   H9003/{H7225G}   HR/Ncfsa
 *
 * The reference is the English one, which is what this project counts in, with the Hebrew or
 * Greek one after it in brackets where the two traditions differ (`Psa.3.0(3.1)`). Verse 0 is a
 * psalm's superscription, which English versification does not number.
 */

/** Which language a tagged file is in; they number their columns differently. */
export type TaggedLanguage = 'hebrew' | 'greek';

export interface TaggedTextFile {
  readonly language: TaggedLanguage;
  readonly text: string;
}

export interface LexiconFile {
  readonly language: TaggedLanguage;
  readonly text: string;
}

export interface StepBibleImportOptions {
  /** Words used in more verses than this are dropped; see `OriginalWordsFile.maxVerses`. */
  readonly maxVerses: number;
  /**
   * Nouns, verbs and adjectives are kept up to this many verses instead; see
   * `OriginalWordsFile.contentWordMaxVerses`. Left out, nothing is kept past `maxVerses`.
   */
  readonly contentWordMaxVerses?: number;
  /** Written into the dataset, which is served as a file in its own right. */
  readonly license: LicenseInfo;
  readonly attribution: string;
  readonly provenance: Omit<DatasetProvenance, 'snapshotDate'>;
}

/**
 * `Book.Chapter.Verse`, with a second reference in brackets when the traditions differ. The
 * source numbers verses as the NRSV does and marks the others by the kind of bracket: round for
 * the Greek and Hebrew, square for the KJV, curly for the rest. This project counts in KJV
 * verses, so a square bracket is the reference to take and the other two are passed over.
 *
 * It matters in both directions: without this, Philippians 1:16 and 1:17 — which the two
 * traditions number the other way round — would each take the other's words.
 */
const REFERENCE = /^([1-3]?[A-Za-z]{2,3})\.(\d+)\.(\d+)(?:([([{])([^)\]}]*)[)\]}])?#/;

/** A reference that begins like one but that the pattern above could not read. */
const REFERENCE_SHAPED = /^[1-3]?[A-Za-z]{2,3}\.\d+\.\d+\S*#/;

/** The contents of a square bracket: the same verse as the KJV numbers it. */
const KJV_REFERENCE = /^(\d+)\.(\d+)$/;

/**
 * A Hebrew word can carry prefixes and suffixes, which are numbered H9000 and up. They are
 * grammar, not vocabulary, so only H0001-H8999 count.
 *
 * The Greek numbers run to five digits (the lexicon documents G10000-G20199 for words Strong
 * never numbered), so a four-digit pattern would read G20447 as G2044 — a real number, and a
 * different word. The Hebrew pattern refuses a fifth digit for the same reason.
 *
 * Both patterns are run over the whole tagging column rather than up to its first `=`, because a
 * Greek word made by running two together (κἀγώ, μήποτε, οὐκέτι) is tagged with both of their
 * numbers, and stopping at the first `=` would keep one and silently lose the other. Nothing
 * else in the column can match: the grammar codes beside the numbers are letters and dashes.
 */
const HEBREW_WORD = /H[0-8]\d{3}[A-Za-z]?(?!\d)/g;
const GREEK_WORD = /G\d{4,5}[A-Za-z]?/g;

/** Where each file keeps the tagging, counting tabs from zero. */
const STRONGS_COLUMN: Readonly<Record<TaggedLanguage, number>> = { hebrew: 4, greek: 3 };

/** Where each file keeps the English its tagging gives a word, counting tabs from zero. */
const ENGLISH_COLUMN: Readonly<Record<TaggedLanguage, number>> = { hebrew: 3, greek: 2 };

/** Where the Hebrew keeps its grammar codes; the Greek writes them beside each number. */
const HEBREW_GRAMMAR_COLUMN = 5;

/** How a word is used in one verse: Tyndale's grammar code and the English it gives it there. */
interface Occurrence {
  readonly grammar: string;
  readonly english: string;
}

/**
 * The grammar and English of one word on a tagged line.
 *
 * A Hebrew line is a word with its prefixes and suffixes, and its three columns split the same
 * way at each `/`: `in/ beginning`, `H9003/{H7225G}`, `HR/Ncfsa`. The part that carries the
 * number carries its grammar and its English. The grammar's first letter says the language —
 * `H` Hebrew, `A` Aramaic — and is written once for the whole line, so it is put back on the part.
 *
 * A Greek line writes the grammar beside each number (`G1473=P-1NS + G2532=CONJ`), and its
 * English belongs to the whole word, which is the best there is for a word made of two.
 */
function occurrenceOn(
  columns: readonly string[],
  language: TaggedLanguage,
  strongs: string,
): Occurrence {
  const english = columns[ENGLISH_COLUMN[language]]?.trim() ?? '';
  if (language === 'greek') {
    const tagging = columns[STRONGS_COLUMN.greek] ?? '';
    const grammar = new RegExp(`${strongs}=([^\\s+]+)`).exec(tagging)?.[1] ?? '';
    return { grammar, english };
  }
  const parts = (columns[STRONGS_COLUMN.hebrew] ?? '').split('/');
  const at = parts.findIndex((part) => part.includes(strongs));
  const grammarColumn = columns[HEBREW_GRAMMAR_COLUMN]?.trim() ?? '';
  const prefix = grammarColumn.slice(0, 1);
  const grammarParts = grammarColumn.slice(1).split('/');
  const englishParts = english.split('/');
  const aligned = at >= 0 && grammarParts.length === parts.length;
  return {
    grammar: aligned ? `${prefix}${grammarParts[at] ?? ''}` : '',
    english:
      aligned && englishParts.length === parts.length ? (englishParts[at]?.trim() ?? '') : english,
  };
}

/**
 * Whether a word is a noun, a verb or an adjective, by the grammar of its first use: the parts of
 * speech that can carry what a passage is about. Articles, conjunctions, prepositions, particles
 * and pronouns are grammar, however a word happens to be counted.
 */
function isContentWord(used: ReadonlyMap<VerseIndex, Occurrence> | undefined): boolean {
  const grammar = used?.values().next().value?.grammar ?? '';
  const part = /^[HA][A-Z]/.test(grammar) ? grammar.slice(1, 2) : grammar.split('-')[0];
  return part === 'N' || part === 'V' || part === 'A';
}

/** An extended Strong's number: a letter, four digits, and a letter when a word is split. */
const STRONGS_NUMBER = /^[GH]\d{4}[A-Za-z]?$/;

/**
 * Columns of a lexicon row:
 * `eStrong# | dStrong | uStrong | Hebrew/Greek | Transliteration | Morph | Gloss | Meaning`.
 *
 * `Gloss` is read and `Meaning` deliberately is not. The files say why: of the gloss, "These
 * were created by Tyndale scholars", which the repository's CC BY 4.0 covers; of the meaning,
 * "These are based on the Abridged BDB by Online Bible, © Larry Pierce of OnlineBible.net ...
 * Permission should be gained from Online Bible before these are applied" (Hebrew), and
 * Abbott-Smith's definitions (Greek). Neither is ours to pass on, so neither is ever read.
 */
const LEXICON = {
  extendedStrongs: 0,
  disambiguated: 1,
  unified: 2,
  lemma: 3,
  transliteration: 4,
  partOfSpeech: 5,
  gloss: 6,
} as const;

/** STEPBible's three-letter book codes, in the canonical order of `BOOKS`. */
// prettier-ignore
export const STEP_BOOK_CODES = [
  'Gen', 'Exo', 'Lev', 'Num', 'Deu', 'Jos', 'Jdg', 'Rut', '1Sa', '2Sa', '1Ki', '2Ki', '1Ch', '2Ch',
  'Ezr', 'Neh', 'Est', 'Job', 'Psa', 'Pro', 'Ecc', 'Sng', 'Isa', 'Jer', 'Lam', 'Ezk', 'Dan', 'Hos',
  'Jol', 'Amo', 'Oba', 'Jon', 'Mic', 'Nam', 'Hab', 'Zep', 'Hag', 'Zec', 'Mal', 'Mat', 'Mrk', 'Luk',
  'Jhn', 'Act', 'Rom', '1Co', '2Co', 'Gal', 'Eph', 'Php', 'Col', '1Th', '2Th', '1Ti', '2Ti', 'Tit',
  'Phm', 'Heb', 'Jas', '1Pe', '2Pe', '1Jn', '2Jn', '3Jn', 'Jud', 'Rev',
] as const;

function bookIdsByStepCode(): ReadonlyMap<string, BookId> {
  if (STEP_BOOK_CODES.length !== BOOKS.length) {
    throw new Error('STEPBible: the book-code list and the canon have drifted apart.');
  }
  const byCode = new Map<string, BookId>();
  STEP_BOOK_CODES.forEach((code, ordinal) => {
    const book = BOOKS[ordinal];
    if (!book) {
      throw new Error(`STEPBible: no book at canonical position ${String(ordinal)}.`);
    }
    byCode.set(code, book.id);
  });
  return byCode;
}

interface LexiconEntry {
  readonly lemma: string;
  readonly transliteration: string;
  readonly gloss: string;
}

/**
 * STEPBible writes a transliteration in syllables with the stressed one capitalised
 * (`be.re.Shit`). The syllables are of no use here; a capital is, but only on a name, which the
 * part of speech is what actually says.
 */
function readTransliteration(raw: string, partOfSpeech: string): string {
  const plain = raw.replaceAll('.', '').toLowerCase();
  // `-P` a person, `-L` a place, `-T` a title: all of them names, all of them capitalised.
  if (!/-[PLT](?![A-Za-z])/.test(partOfSpeech)) {
    return plain;
  }
  return `${plain.slice(0, 1).toUpperCase()}${plain.slice(1)}`;
}

/**
 * TBESH and TBESG, tab-separated:
 *
 *     eStrong | dStrong              | uStrong | form    | translit | morph   | gloss | meaning
 *     H7225   | H7225G =             | H7225G  | רֵאשִׁית  | re.Shit  | N:N-F   | …     | …
 *     H7225   | H7225H = a Meaning of| H7225G  | רֵאשִׁית  | re.Shit  | N:N-F   | …     | …
 *     H1990   | H1990 = a Name of    | H5983   | הָ֑ם     | ham      | N:N-M-P | Ham   | …
 *
 * The tagged texts tag each word with its **disambiguated** number, so that is the key: the one
 * in the second column, before the ` = ` that introduces how it relates to the third.
 *
 * The third column is the *unified* number, which deliberately gathers different words under
 * one heading — a person's several names, a word's several spellings, the Hebrew behind a Greek
 * name. Keying on it hands a word its neighbour's entry: Ammon labelled "Ham", Esau "Edom",
 * Thomas "Twin", and τρεῖς ("three") "Taverns".
 */
function parseLexicon(text: string): Map<string, LexiconEntry> {
  const primary = new Map<string, LexiconEntry>();
  const fallback = new Map<string, LexiconEntry>();
  for (const line of stripByteOrderMark(text).split(/\r?\n/)) {
    const columns = line.split('\t');
    const extended = columns[LEXICON.extendedStrongs]?.trim() ?? '';
    const disambiguated = columns[LEXICON.disambiguated]?.split('=')[0]?.trim() ?? '';
    if (!STRONGS_NUMBER.test(disambiguated)) {
      continue;
    }
    const lemma = columns[LEXICON.lemma]?.trim() ?? '';
    const gloss = columns[LEXICON.gloss]?.trim() ?? '';
    if (lemma === '' || gloss === '') {
      continue;
    }
    const entry: LexiconEntry = {
      lemma,
      transliteration: readTransliteration(
        columns[LEXICON.transliteration]?.trim() ?? '',
        columns[LEXICON.partOfSpeech] ?? '',
      ),
      // A handful of glosses carry two senses, separated the way a lexicon does it.
      gloss: gloss.replaceAll(/\s*[:|]\s*/g, ' / '),
    };
    if (!primary.has(disambiguated)) {
      primary.set(disambiguated, entry);
    }
    // The plain number stands in for a word the texts tag without a disambiguating letter.
    if (STRONGS_NUMBER.test(extended) && !fallback.has(extended)) {
      fallback.set(extended, entry);
    }
  }
  if (primary.size === 0) {
    throw new Error('STEPBible: a lexicon file had no usable entries.');
  }
  for (const [key, entry] of fallback) {
    if (!primary.has(key)) {
      primary.set(key, entry);
    }
  }
  return primary;
}

interface TaggedWords {
  readonly file: OriginalWordsFile;
  /** By word, then by verse: how the word is used there, for the first time it is. */
  readonly occurrences: ReadonlyMap<string, ReadonlyMap<VerseIndex, Occurrence>>;
}

export function importStepBibleWords(
  files: readonly TaggedTextFile[],
  lexicons: readonly LexiconFile[],
  options: StepBibleImportOptions,
): OriginalWordsFile {
  return readTaggedWords(files, lexicons, options).file;
}

/**
 * How each word of `importStepBibleWords` is used in each of its verses, in that dataset's order,
 * so the two line up entry for entry.
 */
export function importStepBibleOccurrences(
  files: readonly TaggedTextFile[],
  lexicons: readonly LexiconFile[],
  options: StepBibleImportOptions,
): WordOccurrencesFile {
  const { file, occurrences } = readTaggedWords(files, lexicons, options);
  const grammarCodes = new Map<string, number>();
  const grammarAt: number[] = [];
  const english: string[] = [];
  file.words.strongs.forEach((strongs, word) => {
    const start = file.words.offsets[word] ?? 0;
    const end = file.words.offsets[word + 1] ?? start;
    for (let at = start; at < end; at += 1) {
      const verse = file.words.verses[at] ?? 0;
      const found = occurrences.get(strongs)?.get(verse) ?? { grammar: '', english: '' };
      let code = grammarCodes.get(found.grammar);
      if (code === undefined) {
        code = grammarCodes.size;
        grammarCodes.set(found.grammar, code);
      }
      grammarAt.push(code);
      english.push(found.english);
    }
  });
  return {
    format: 'word-occurrences',
    schemaVersion: DATASET_SCHEMA_VERSION,
    versification: file.versification,
    provenance: file.provenance,
    notices: [],
    sourceId: 'stepbible',
    license: file.license,
    attribution: file.attribution,
    verseEntries: file.words.verses.length,
    occurrences: { grammar: [...grammarCodes.keys()], grammarAt, english },
  };
}

function readTaggedWords(
  files: readonly TaggedTextFile[],
  lexicons: readonly LexiconFile[],
  { maxVerses, contentWordMaxVerses, license, attribution, provenance }: StepBibleImportOptions,
): TaggedWords {
  const versification = CANONICAL_VERSIFICATION;
  const bookIds = bookIdsByStepCode();

  const lexicon = new Map<string, LexiconEntry>();
  for (const file of lexicons) {
    for (const [strongs, entry] of parseLexicon(file.text)) {
      lexicon.set(strongs, entry);
    }
  }

  const uses = new Map<string, Map<VerseIndex, Occurrence>>();
  const versesByWord = new Map<string, Set<VerseIndex>>();
  const unknownBooks: string[] = [];
  const unknownReferences: string[] = [];
  const unreadableReferences: string[] = [];
  const superscriptions: string[] = [];
  let wordCount = 0;

  for (const { language, text } of files) {
    const column = STRONGS_COLUMN[language];
    const pattern = language === 'hebrew' ? HEBREW_WORD : GREEK_WORD;
    for (const line of stripByteOrderMark(text).split(/\r?\n/)) {
      const reference = REFERENCE.exec(line);
      if (!reference) {
        // Nothing else in these files begins like a reference, so anything that does and cannot
        // be read is a shape this importer has not met — and dropping it would lose words
        // without saying so.
        if (REFERENCE_SHAPED.test(line)) {
          unreadableReferences.push(line.slice(0, 24));
        }
        continue;
      }
      const [, code = '', chapterText = '', verseText = '', bracket = '', inside = ''] = reference;
      const book = bookIds.get(code);
      if (book === undefined) {
        unknownBooks.push(code);
        continue;
      }
      // A square bracket holds the same verse as the KJV numbers it, which is this project's
      // scheme; the leading reference follows the NRSV.
      const kjv = bracket === '[' ? KJV_REFERENCE.exec(inside) : null;
      const chapterNumber = Number(kjv ? kjv[1] : chapterText);
      const verseNumber = Number(kjv ? kjv[2] : verseText);
      if (verseNumber === 0) {
        // A psalm's superscription. English versification has no verse for it, and inventing one
        // would put words in a verse that does not contain them.
        superscriptions.push(`${code}.${String(chapterNumber)}`);
        continue;
      }
      const verse = versification.indexOf({ book, chapter: chapterNumber, verse: verseNumber });
      if (verse === undefined) {
        unknownReferences.push(`${code}.${String(chapterNumber)}.${String(verseNumber)}`);
        continue;
      }
      const columns = line.split('\t');
      const tagging = columns[column] ?? '';
      for (const strongs of tagging.match(pattern) ?? []) {
        wordCount += 1;
        let used = uses.get(strongs);
        if (!used) {
          used = new Map();
          uses.set(strongs, used);
        }
        if (!used.has(verse)) {
          used.set(verse, occurrenceOn(columns, language, strongs));
        }
        let verses = versesByWord.get(strongs);
        if (!verses) {
          verses = new Set();
          versesByWord.set(strongs, verses);
        }
        verses.add(verse);
      }
    }
  }

  if (unreadableReferences.length > 0) {
    throw new Error(
      `STEPBible: ${String(unreadableReferences.length)} lines begin with a reference this ` +
        `importer cannot read, e.g. ${unreadableReferences.slice(0, 5).join(', ')}.`,
    );
  }

  if (unknownBooks.length > 0) {
    throw new Error(`STEPBible: unknown book codes (${[...new Set(unknownBooks)].join(', ')}).`);
  }

  if (wordCount === 0) {
    throw new Error('STEPBible: no tagged words were found; the format may have changed.');
  }

  const tooCommon: string[] = [];
  const unlisted: string[] = [];
  const strongs: string[] = [];
  const lemma: string[] = [];
  const transliteration: string[] = [];
  const gloss: string[] = [];
  const offsets: number[] = [0];
  const verses: number[] = [];

  for (const key of [...versesByWord.keys()].sort()) {
    const occurrences = versesByWord.get(key) ?? new Set<VerseIndex>();
    const keptUpTo = isContentWord(uses.get(key)) ? (contentWordMaxVerses ?? maxVerses) : maxVerses;
    if (occurrences.size > Math.max(maxVerses, keptUpTo)) {
      tooCommon.push(key);
      continue;
    }
    const entry = lexicon.get(key);
    if (!entry) {
      // Without a dictionary form there is nothing to show, so the word is dropped rather than
      // shown as a bare number.
      unlisted.push(key);
      continue;
    }
    strongs.push(key);
    lemma.push(entry.lemma);
    transliteration.push(entry.transliteration);
    gloss.push(entry.gloss);
    verses.push(...[...occurrences].sort((a, b) => a - b));
    offsets.push(verses.length);
  }

  const notices: ImportNotice[] = [
    createNotice('info', 'Words left out as too common to be meaningful', tooCommon),
    createNotice('info', 'Words left out for having no lexicon entry', unlisted),
    createNotice(
      'info',
      'Words of psalm superscriptions, which English verse numbering has no slot for',
      superscriptions,
    ),
  ];
  if (unknownReferences.length > 0) {
    throw new Error(
      `STEPBible: ${String(unknownReferences.length)} references are outside the ` +
        `${versification.id} versification, e.g. ${unknownReferences.slice(0, 5).join(', ')}.`,
    );
  }

  const file: OriginalWordsFile = {
    format: 'original-words',
    schemaVersion: DATASET_SCHEMA_VERSION,
    versification: versification.id,
    provenance: { ...provenance, snapshotDate: null },
    notices,
    sourceId: 'stepbible',
    license,
    attribution,
    maxVerses,
    ...(contentWordMaxVerses === undefined ? {} : { contentWordMaxVerses }),
    words: { strongs, lemma, transliteration, gloss, offsets, verses },
  };
  return { file, occurrences: uses };
}
