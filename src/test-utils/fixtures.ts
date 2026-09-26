import type { BookId } from '../core/bible/books.ts';
import type { VerseIndex } from '../core/bible/verse-ref.ts';
import { CANONICAL_VERSIFICATION } from '../core/bible/versification.ts';
import type {
  CrossReferenceColumns,
  DatasetProvenance,
  TranslationTextFile,
} from '../core/datasets/formats.ts';

export const PROVENANCE: DatasetProvenance = {
  url: 'https://example.org/source',
  sha256: 'a'.repeat(64),
  retrievedAt: '2026-01-01',
  snapshotDate: null,
};

/** Canonical index of a verse; throws for verses that do not exist (a broken test). */
export function verseIndex(book: BookId, chapter: number, verse: number): VerseIndex {
  const index = CANONICAL_VERSIFICATION.indexOf({ book, chapter, verse });
  if (index === undefined) {
    throw new Error(`No such verse: ${book} ${chapter}:${verse}`);
  }
  return index;
}

/** A complete translation file whose verse texts are overridden where given. */
export function createTranslationFile(
  overrides: ReadonlyMap<VerseIndex, string> = new Map(),
): TranslationTextFile {
  return {
    format: 'translation-text',
    schemaVersion: 1,
    versification: 'kjv',
    provenance: PROVENANCE,
    notices: [],
    translationId: 'bsb',
    verses: Array.from(
      { length: CANONICAL_VERSIFICATION.verseCount },
      (_, index) => overrides.get(index) ?? `Verse number ${index}.`,
    ),
  };
}

export interface LinkSpec {
  readonly from: VerseIndex;
  readonly to: VerseIndex;
  readonly toEnd?: VerseIndex;
  readonly votes?: number;
}

/** Builds CSR columns from links (in any order) for a versification of `verseCount` verses. */
export function createCrossReferenceColumns(
  links: readonly LinkSpec[],
  verseCount: number = CANONICAL_VERSIFICATION.verseCount,
): CrossReferenceColumns {
  const sorted = [...links].sort((a, b) => a.from - b.from);
  const offsets = new Array<number>(verseCount + 1).fill(0);
  for (const link of sorted) {
    offsets[link.from + 1] = (offsets[link.from + 1] ?? 0) + 1;
  }
  for (let verse = 0; verse < verseCount; verse += 1) {
    offsets[verse + 1] = (offsets[verse + 1] ?? 0) + (offsets[verse] ?? 0);
  }
  return {
    offsets,
    targetStart: sorted.map((link) => link.to),
    targetEnd: sorted.map((link) => link.toEnd ?? link.to),
    votes: sorted.map((link) => link.votes ?? 0),
  };
}
