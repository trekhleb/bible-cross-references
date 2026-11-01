import type { VersificationId } from '../bible/versification.ts';
import {
  expectArrayOf,
  expectInteger,
  expectIntegerArray,
  expectNullableString,
  expectOneOf,
  expectRecord,
  expectString,
  ValidationError,
  expectStringArray,
} from '../lib/validation.ts';
import type { CrossReferenceSourceId, TranslationId, WordSourceId } from './ids.ts';
import type { LicenseInfo } from './metadata.ts';

/**
 * File formats of the generated datasets, shared by the data pipeline (which writes them) and the
 * app (which validates them when loading). Bump `DATASET_SCHEMA_VERSION` on any breaking change.
 */
export const DATASET_SCHEMA_VERSION = 1;

/** Where a dataset came from, so that every number shown in the app can be traced back. */
export interface DatasetProvenance {
  /** URL the raw source file was downloaded from. */
  readonly url: string;
  /** SHA-256 of the raw source file (hex). */
  readonly sha256: string;
  /** Date (YYYY-MM-DD) on which the pinned raw file was retrieved. */
  readonly retrievedAt: string;
  /** Date (YYYY-MM-DD) of the upstream snapshot, if the source publishes one. */
  readonly snapshotDate: string | null;
}

/** Something the importer noticed or changed while converting the raw source. */
export interface ImportNotice {
  readonly level: 'info' | 'warning';
  readonly message: string;
  readonly count: number;
  /** A few affected items (e.g. verse IDs), for debugging. */
  readonly examples: readonly string[];
}

interface DatasetFileBase<Format extends string> {
  readonly format: Format;
  readonly schemaVersion: typeof DATASET_SCHEMA_VERSION;
  readonly versification: VersificationId;
  readonly provenance: DatasetProvenance;
  readonly notices: readonly ImportNotice[];
}

export interface TranslationTextFile extends DatasetFileBase<'translation-text'> {
  readonly translationId: TranslationId;
  /**
   * Carried in the file itself: a translation is served on its own, and kept on readers' devices
   * by the offline cache, so a copy that travels without the app should still say whose text it
   * is and under what licence.
   *
   * Optional when reading, always written when building. The offline cache keeps datasets across
   * releases under a URL with no content hash, so the first load after a deployment parses the
   * *previous* release's file: a field this release added cannot be one the parser demands, or
   * every installed reader meets a validation error instead of the app. Nothing here is read at
   * runtime — the app shows `manifest.license` from its own registry — so absence is harmless.
   */
  readonly license?: LicenseInfo;
  readonly attribution?: string;
  /** Verse texts in canonical order. An empty string marks a verse the translation omits. */
  readonly verses: readonly string[];
}

/**
 * Cross-reference links in columnar, compressed-sparse-row (CSR) layout, grouped by source verse:
 * the links of source verse `v` occupy positions `offsets[v]` to `offsets[v + 1] - 1` of the
 * other columns. Targets are inclusive verse-index ranges (`targetStart === targetEnd` for a
 * single verse).
 */
export interface CrossReferenceColumns {
  readonly offsets: readonly number[];
  readonly targetStart: readonly number[];
  readonly targetEnd: readonly number[];
  readonly votes: readonly number[];
}

export interface CrossReferencesFile extends DatasetFileBase<'cross-references'> {
  readonly sourceId: CrossReferenceSourceId;
  /** Number of data rows in the raw source file. */
  readonly sourceRowCount: number;
  /** As on a translation, and for the same reason: this file is served and cached on its own. */
  readonly license?: LicenseInfo;
  readonly attribution?: string;
  readonly links: CrossReferenceColumns;
}

/**
 * Words of the original languages, one entry per dictionary form, in the same columnar layout as
 * the links: the verses of word `w` occupy positions `offsets[w]` to `offsets[w + 1] - 1` of
 * `verses`. Only the dictionary form is kept, never the text of a verse.
 */
export interface OriginalWordColumns {
  /** Extended Strong's number, e.g. `G4128`. Sorted, so a word can be found by binary search. */
  readonly strongs: readonly string[];
  /** Dictionary form in its own script, e.g. `πλῆθος`. */
  readonly lemma: readonly string[];
  readonly transliteration: readonly string[];
  /** A few words of English, e.g. `multitude`. */
  readonly gloss: readonly string[];
  readonly offsets: readonly number[];
  readonly verses: readonly number[];
}

export interface OriginalWordsFile extends DatasetFileBase<'original-words'> {
  readonly sourceId: WordSourceId;
  /** Carried in the file itself: it is served on its own, and a copy should say what it is. */
  readonly license: LicenseInfo;
  readonly attribution: string;
  /**
   * Words used in more verses than this are left out. A word that appears everywhere says
   * nothing about the verse it is in, and the pairs for it outweigh all the rest together.
   */
  readonly maxVerses: number;
  /**
   * Nouns, verbs and adjectives are kept up to this many verses, past `maxVerses`, so that two
   * passages can be compared on "love" or "neighbour" — words too common to list beside a verse,
   * but far from meaningless when both ends of a link use them. Grammatical words never are.
   * Absent in a file built before it existed, which kept nothing past `maxVerses`.
   */
  readonly contentWordMaxVerses?: number;
  readonly words: OriginalWordColumns;
}

/**
 * How each word is used in each verse it appears in, aligned position for position with
 * `OriginalWordColumns.verses`: entry `i` here describes the word and verse at entry `i` there.
 * Kept apart from the words because nothing needs it until a reader asks why two passages are
 * linked, and most readers never do.
 *
 * Only Tyndale's tagging is kept — the grammar code and the English it gives the word in that
 * verse — never the word as it is spelled in the verse, for the reason the words keep only the
 * dictionary form (see the STEPBible importer).
 */
export interface WordOccurrenceColumns {
  /** Every grammar code, once; `grammarAt` points into it. E.g. `V-AAI-3S`, `Vqp3ms`. */
  readonly grammar: readonly string[];
  /** Per verse entry: the grammar of the word's first use in that verse, as an index. */
  readonly grammarAt: readonly number[];
  /** Per verse entry: the English the tagging gives the word there, e.g. `he created`. */
  readonly english: readonly string[];
}

export interface WordOccurrencesFile extends DatasetFileBase<'word-occurrences'> {
  readonly sourceId: WordSourceId;
  readonly license: LicenseInfo;
  readonly attribution: string;
  /** How many verse entries the words dataset it belongs to has, so a mismatch is caught. */
  readonly verseEntries: number;
  readonly occurrences: WordOccurrenceColumns;
}

function parseProvenance(value: unknown, path: string): DatasetProvenance {
  const record = expectRecord(value, path);
  return {
    url: expectString(record['url'], `${path}.url`),
    sha256: expectString(record['sha256'], `${path}.sha256`),
    retrievedAt: expectString(record['retrievedAt'], `${path}.retrievedAt`),
    snapshotDate: expectNullableString(record['snapshotDate'], `${path}.snapshotDate`),
  };
}

function parseNotice(value: unknown, path: string): ImportNotice {
  const record = expectRecord(value, path);
  return {
    level: expectOneOf(record['level'], ['info', 'warning'], `${path}.level`),
    message: expectString(record['message'], `${path}.message`),
    count: expectInteger(record['count'], `${path}.count`),
    examples: expectStringArray(record['examples'], `${path}.examples`),
  };
}

function parseFileBase<const Format extends string>(
  json: unknown,
  format: Format,
  versification: VersificationId,
): { record: Readonly<Record<string, unknown>>; base: DatasetFileBase<Format> } {
  const record = expectRecord(json, 'file');
  return {
    record,
    base: {
      format: expectOneOf(record['format'], [format], 'format'),
      schemaVersion: expectOneOf(
        record['schemaVersion'],
        [DATASET_SCHEMA_VERSION],
        'schemaVersion',
      ),
      // Mapping between versifications is not supported yet, so a dataset must use the expected one.
      versification: expectOneOf(record['versification'], [versification], 'versification'),
      provenance: parseProvenance(record['provenance'], 'provenance'),
      notices: expectArrayOf(record['notices'], 'notices', parseNotice),
    },
  };
}

/** What a dataset file must be, as declared by the manifest of the plugin that loads it. */
export interface ExpectedDataset<Id extends string> {
  readonly id: Id;
  readonly versification: VersificationId;
}

/**
 * The licence block both self-describing datasets carry. `publicDomain` is a fact about the work
 * rather than a display choice, so it travels with a file that is served on its own; a file that
 * does not say is treated as licensed, which is the safe way round.
 */
function expectLicense(value: unknown): LicenseInfo {
  const license = expectRecord(value, 'license');
  const publicDomain = license['publicDomain'];
  if (publicDomain !== undefined && typeof publicDomain !== 'boolean') {
    throw new ValidationError(
      'license.publicDomain',
      `expected a boolean, got ${typeof publicDomain}`,
    );
  }
  return {
    name: expectString(license['name'], 'license.name'),
    url: expectString(license['url'], 'license.url'),
    ...(publicDomain === undefined ? {} : { publicDomain }),
  };
}

export function parseTranslationTextFile(
  json: unknown,
  expected: ExpectedDataset<TranslationId>,
): TranslationTextFile {
  const { record, base } = parseFileBase(json, 'translation-text', expected.versification);
  const license = record['license'];
  const attribution = record['attribution'];
  return {
    ...base,
    translationId: expectOneOf(record['translationId'], [expected.id], 'translationId'),
    // Absent only in a file cached before these fields existed; present, it is still validated.
    ...(license === undefined ? {} : { license: expectLicense(license) }),
    ...(attribution === undefined ? {} : { attribution: expectString(attribution, 'attribution') }),
    verses: expectStringArray(record['verses'], 'verses'),
  };
}

export function parseCrossReferencesFile(
  json: unknown,
  expected: ExpectedDataset<CrossReferenceSourceId>,
): CrossReferencesFile {
  const { record, base } = parseFileBase(json, 'cross-references', expected.versification);
  const links = expectRecord(record['links'], 'links');
  const license = record['license'];
  const attribution = record['attribution'];
  return {
    ...base,
    sourceId: expectOneOf(record['sourceId'], [expected.id], 'sourceId'),
    sourceRowCount: expectInteger(record['sourceRowCount'], 'sourceRowCount'),
    ...(license === undefined ? {} : { license: expectLicense(license) }),
    ...(attribution === undefined ? {} : { attribution: expectString(attribution, 'attribution') }),
    links: {
      offsets: expectIntegerArray(links['offsets'], 'links.offsets'),
      targetStart: expectIntegerArray(links['targetStart'], 'links.targetStart'),
      targetEnd: expectIntegerArray(links['targetEnd'], 'links.targetEnd'),
      votes: expectIntegerArray(links['votes'], 'links.votes'),
    },
  };
}

export function parseOriginalWordsFile(
  json: unknown,
  expected: ExpectedDataset<WordSourceId>,
): OriginalWordsFile {
  const { record, base } = parseFileBase(json, 'original-words', expected.versification);
  const words = expectRecord(record['words'], 'words');
  return {
    ...base,
    sourceId: expectOneOf(record['sourceId'], [expected.id], 'sourceId'),
    license: expectLicense(record['license']),
    attribution: expectString(record['attribution'], 'attribution'),
    maxVerses: expectInteger(record['maxVerses'], 'maxVerses'),
    ...(record['contentWordMaxVerses'] === undefined
      ? {}
      : {
          contentWordMaxVerses: expectInteger(
            record['contentWordMaxVerses'],
            'contentWordMaxVerses',
          ),
        }),
    words: {
      strongs: expectStringArray(words['strongs'], 'words.strongs'),
      lemma: expectStringArray(words['lemma'], 'words.lemma'),
      transliteration: expectStringArray(words['transliteration'], 'words.transliteration'),
      gloss: expectStringArray(words['gloss'], 'words.gloss'),
      offsets: expectIntegerArray(words['offsets'], 'words.offsets'),
      verses: expectIntegerArray(words['verses'], 'words.verses'),
    },
  };
}

export function parseWordOccurrencesFile(
  json: unknown,
  expected: ExpectedDataset<WordSourceId>,
): WordOccurrencesFile {
  const { record, base } = parseFileBase(json, 'word-occurrences', expected.versification);
  const occurrences = expectRecord(record['occurrences'], 'occurrences');
  const verseEntries = expectInteger(record['verseEntries'], 'verseEntries');
  const grammar = expectStringArray(occurrences['grammar'], 'occurrences.grammar');
  const grammarAt = expectIntegerArray(occurrences['grammarAt'], 'occurrences.grammarAt');
  const english = expectStringArray(occurrences['english'], 'occurrences.english');
  if (grammarAt.length !== verseEntries || english.length !== verseEntries) {
    throw new ValidationError('occurrences', 'expected one entry per verse entry of the words');
  }
  if (grammarAt.some((index) => index < 0 || index >= grammar.length)) {
    throw new ValidationError('occurrences.grammarAt', 'points outside occurrences.grammar');
  }
  return {
    ...base,
    sourceId: expectOneOf(record['sourceId'], [expected.id], 'sourceId'),
    license: expectLicense(record['license']),
    attribution: expectString(record['attribution'], 'attribution'),
    verseEntries,
    occurrences: { grammar, grammarAt, english },
  };
}
