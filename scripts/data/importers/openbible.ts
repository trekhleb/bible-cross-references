import { parseOsisId, type VerseIndex } from '../../../src/core/bible/verse-ref.ts';
import { CANONICAL_VERSIFICATION } from '../../../src/core/bible/versification.ts';
import {
  DATASET_SCHEMA_VERSION,
  type CrossReferencesFile,
  type DatasetProvenance,
  type ImportNotice,
} from '../../../src/core/datasets/formats.ts';
import { stripByteOrderMark } from '../lib/files.ts';
import { createNotice } from '../lib/notices.ts';

/**
 * Importer for the OpenBible.info cross-reference dataset
 * (https://www.openbible.info/labs/cross-references/).
 *
 * Format: a TSV file whose header is `From Verse<TAB>To Verse<TAB>Votes<TAB>#… CC-BY <date>`,
 * followed by rows like `Gen.1.1<TAB>Rom.1.19-Rom.1.20<TAB>59`. Sources are single verses;
 * targets are a verse or an inclusive range; votes are integers and may be negative.
 */

const HEADER_PREFIX = 'From Verse\tTo Verse\tVotes';
const SNAPSHOT_DATE_PATTERN = /\b(\d{4}-\d{2}-\d{2})\b/;

/** Verse IDs used by OpenBible that do not exist in the KJV versification. */
const VERSE_REMAPS: ReadonlyMap<string, string> = new Map([
  // Some modern editions split 3 John 1:14 into verses 14 and 15; the KJV versification does not.
  ['3John.1.15', '3John.1.14'],
]);

interface Link {
  readonly from: VerseIndex;
  readonly targetStart: VerseIndex;
  readonly targetEnd: VerseIndex;
  readonly votes: number;
}

function compareLinks(a: Link, b: Link): number {
  return (
    a.from - b.from ||
    b.votes - a.votes ||
    a.targetStart - b.targetStart ||
    a.targetEnd - b.targetEnd
  );
}

export function importOpenBibleCrossReferences(
  text: string,
  provenance: Omit<DatasetProvenance, 'snapshotDate'>,
): CrossReferencesFile {
  const versification = CANONICAL_VERSIFICATION;
  const [header = '', ...rows] = stripByteOrderMark(text).split(/\r?\n/);
  if (!header.startsWith(HEADER_PREFIX)) {
    throw new Error(`OpenBible: unexpected header "${header.slice(0, 80)}".`);
  }
  const snapshotDate = SNAPSHOT_DATE_PATTERN.exec(header)?.[1] ?? null;

  const remapped: string[] = [];
  const resolveVerse = (osisId: string, lineNumber: number): VerseIndex => {
    const remappedId = VERSE_REMAPS.get(osisId);
    if (remappedId !== undefined) {
      remapped.push(`line ${lineNumber}: ${osisId} → ${remappedId}`);
    }
    const ref = parseOsisId(remappedId ?? osisId);
    const index = ref && versification.indexOf(ref);
    if (index === undefined) {
      throw new Error(`OpenBible line ${lineNumber}: unknown verse "${osisId}".`);
    }
    return index;
  };

  const links: Link[] = [];
  const seen = new Set<string>();
  const duplicates: string[] = [];
  let sourceRowCount = 0;
  rows.forEach((row, offset) => {
    if (row.trim() === '') {
      return;
    }
    sourceRowCount += 1;
    const lineNumber = offset + 2;
    const fields = row.split('\t');
    const [fromId = '', targetId = '', votesText = ''] = fields;
    const [targetStartId = '', targetEndId = targetStartId, ...extraRangeParts] =
      targetId.split('-');
    const votes = Number(votesText);
    if (fields.length !== 3 || extraRangeParts.length > 0 || !Number.isInteger(votes)) {
      throw new Error(`OpenBible line ${lineNumber}: malformed row "${row}".`);
    }

    const link: Link = {
      from: resolveVerse(fromId, lineNumber),
      targetStart: resolveVerse(targetStartId, lineNumber),
      targetEnd: resolveVerse(targetEndId, lineNumber),
      votes,
    };
    if (link.targetStart > link.targetEnd) {
      throw new Error(`OpenBible line ${lineNumber}: reversed range "${targetId}".`);
    }
    const key = `${link.from}:${link.targetStart}:${link.targetEnd}`;
    if (seen.has(key)) {
      duplicates.push(`line ${lineNumber}: ${fromId} → ${targetId}`);
      return;
    }
    seen.add(key);
    links.push(link);
  });

  links.sort(compareLinks);
  const offsets = new Array<number>(versification.verseCount + 1).fill(0);
  for (const link of links) {
    offsets[link.from + 1] = (offsets[link.from + 1] ?? 0) + 1;
  }
  for (let verse = 0; verse < versification.verseCount; verse += 1) {
    offsets[verse + 1] = (offsets[verse + 1] ?? 0) + (offsets[verse] ?? 0);
  }

  const notices: ImportNotice[] = [];
  if (snapshotDate === null) {
    notices.push(createNotice('warning', 'The header has no snapshot date.', [header]));
  }
  if (remapped.length > 0) {
    notices.push(
      createNotice(
        'info',
        'Verse IDs remapped to the KJV versification (3 John 1:15 is part of 1:14 there).',
        remapped,
      ),
    );
  }
  if (duplicates.length > 0) {
    notices.push(createNotice('warning', 'Duplicate rows dropped (first kept).', duplicates));
  }

  return {
    format: 'cross-references',
    schemaVersion: DATASET_SCHEMA_VERSION,
    versification: versification.id,
    provenance: { ...provenance, snapshotDate },
    notices,
    sourceId: 'openbible',
    sourceRowCount,
    links: {
      offsets,
      targetStart: links.map((link) => link.targetStart),
      targetEnd: links.map((link) => link.targetEnd),
      votes: links.map((link) => link.votes),
    },
  };
}
