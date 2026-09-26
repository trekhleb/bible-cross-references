import { getBook, getReferenceName } from './books.ts';
import type { VerseIndex, VerseRef } from './verse-ref.ts';
import type { Versification } from './versification.ts';

/** Formats a verse for display, e.g. `Genesis 1:1` or `Psalm 23:4`. */
export function formatVerseRef(ref: VerseRef): string {
  return `${getReferenceName(getBook(ref.book))} ${ref.chapter}:${ref.verse}`;
}

/**
 * Formats an inclusive verse range compactly, e.g. `Romans 1:19–20`, `Genesis 1:31–2:3` or
 * `Genesis 50:26 – Exodus 1:1`.
 */
export function formatVerseRange(start: VerseRef, end: VerseRef): string {
  if (start.book !== end.book) {
    return `${formatVerseRef(start)} – ${formatVerseRef(end)}`;
  }
  if (start.chapter !== end.chapter) {
    return `${formatVerseRef(start)}–${end.chapter}:${end.verse}`;
  }
  if (start.verse !== end.verse) {
    return `${formatVerseRef(start)}–${end.verse}`;
  }
  return formatVerseRef(start);
}

/** Formats a verse, or an inclusive range of verses, given by canonical indices. */
export function formatVerseIndexRange(
  versification: Versification,
  start: VerseIndex,
  end: VerseIndex = start,
): string {
  return formatVerseRange(versification.refAt(start), versification.refAt(end));
}
