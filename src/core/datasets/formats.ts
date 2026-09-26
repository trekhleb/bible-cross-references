import type { VersificationId } from '../bible/versification.ts';
import {
  expectArrayOf,
  expectInteger,
  expectIntegerArray,
  expectNullableString,
  expectOneOf,
  expectRecord,
  expectString,
  expectStringArray,
} from '../lib/validation.ts';
import type { CrossReferenceSourceId, TranslationId } from './ids.ts';

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
  readonly links: CrossReferenceColumns;
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

export function parseTranslationTextFile(
  json: unknown,
  expected: ExpectedDataset<TranslationId>,
): TranslationTextFile {
  const { record, base } = parseFileBase(json, 'translation-text', expected.versification);
  return {
    ...base,
    translationId: expectOneOf(record['translationId'], [expected.id], 'translationId'),
    verses: expectStringArray(record['verses'], 'verses'),
  };
}

export function parseCrossReferencesFile(
  json: unknown,
  expected: ExpectedDataset<CrossReferenceSourceId>,
): CrossReferencesFile {
  const { record, base } = parseFileBase(json, 'cross-references', expected.versification);
  const links = expectRecord(record['links'], 'links');
  return {
    ...base,
    sourceId: expectOneOf(record['sourceId'], [expected.id], 'sourceId'),
    sourceRowCount: expectInteger(record['sourceRowCount'], 'sourceRowCount'),
    links: {
      offsets: expectIntegerArray(links['offsets'], 'links.offsets'),
      targetStart: expectIntegerArray(links['targetStart'], 'links.targetStart'),
      targetEnd: expectIntegerArray(links['targetEnd'], 'links.targetEnd'),
      votes: expectIntegerArray(links['votes'], 'links.votes'),
    },
  };
}
