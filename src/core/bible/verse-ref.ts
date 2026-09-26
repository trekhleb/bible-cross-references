import { isBookId, type BookId } from './books.ts';

/** A single verse, addressed by book, chapter and verse number (1-based). */
export interface VerseRef {
  readonly book: BookId;
  readonly chapter: number;
  readonly verse: number;
}

/**
 * Zero-based position of a verse in canonical order within a versification.
 *
 * Indices are dense (0 … verseCount − 1), which makes them cheap to store in typed arrays and to
 * use as keys, and preserves canonical order: ranges are simply `[start, end]` index pairs.
 */
export type VerseIndex = number;

const OSIS_VERSE_ID_PATTERN = /^([1-3]?[A-Za-z]+)\.(\d+)\.(\d+)$/;

/** Formats a verse as an OSIS ID, e.g. `Gen.1.1`. */
export function toOsisId(ref: VerseRef): string {
  return `${ref.book}.${ref.chapter}.${ref.verse}`;
}

/**
 * Parses an OSIS verse ID such as `Gen.1.1`.
 *
 * Only the syntax and the book are validated; whether the chapter and verse exist depends on the
 * versification.
 */
export function parseOsisId(id: string): VerseRef | undefined {
  const match = OSIS_VERSE_ID_PATTERN.exec(id);
  if (!match) {
    return undefined;
  }
  const [, book = '', chapter = '', verse = ''] = match;
  if (!isBookId(book)) {
    return undefined;
  }
  return { book, chapter: Number(chapter), verse: Number(verse) };
}
