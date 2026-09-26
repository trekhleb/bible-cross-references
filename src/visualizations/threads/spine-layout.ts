import { BOOKS, type BookId } from '../../core/bible/books.ts';
import { getBookGenre } from '../../core/bible/genres.ts';
import type { VerseIndex } from '../../core/bible/verse-ref.ts';
import type { Versification } from '../../core/bible/versification.ts';

/** One book's stretch of the spine. */
export interface SpineSegment {
  readonly book: BookId;
  readonly genreOrdinal: number;
  readonly start: VerseIndex;
  readonly end: VerseIndex;
  readonly top: number;
  readonly bottom: number;
}

/**
 * The whole Bible as a vertical bar: books stacked in canonical order, each as tall as its
 * number of verses, with small gaps between books and larger ones between genres.
 */
export interface SpineLayout {
  readonly segments: readonly SpineSegment[];
  /** Vertical position of a verse's center. */
  readonly yOf: (verse: VerseIndex) => number;
  /** The verse at a vertical position, or `null` outside the books. */
  readonly verseAt: (y: number) => VerseIndex | null;
}

export interface SpineGaps {
  readonly book: number;
  readonly genre: number;
}

export function computeSpineLayout(
  versification: Versification,
  top: number,
  bottom: number,
  gaps: SpineGaps,
): SpineLayout {
  let genreBreaks = 0;
  BOOKS.forEach((book, index) => {
    const previous = BOOKS[index - 1];
    if (previous && getBookGenre(previous.id).ordinal !== getBookGenre(book.id).ordinal) {
      genreBreaks += 1;
    }
  });
  const gapTotal = (BOOKS.length - 1 - genreBreaks) * gaps.book + genreBreaks * gaps.genre;
  const pixelsPerVerse = Math.max(bottom - top - gapTotal, 0) / versification.verseCount;

  const segments: SpineSegment[] = [];
  let y = top;
  BOOKS.forEach((book, index) => {
    const previous = BOOKS[index - 1];
    const genreOrdinal = getBookGenre(book.id).ordinal;
    if (previous) {
      y += getBookGenre(previous.id).ordinal === genreOrdinal ? gaps.book : gaps.genre;
    }
    const range = versification.bookRange(book.id);
    const height = (range.end - range.start + 1) * pixelsPerVerse;
    segments.push({
      book: book.id,
      genreOrdinal,
      start: range.start,
      end: range.end,
      top: y,
      bottom: y + height,
    });
    y += height;
  });

  const segmentOf = (verse: VerseIndex) =>
    segments.find((segment) => verse >= segment.start && verse <= segment.end);

  return {
    segments,
    yOf: (verse) => {
      const segment = segmentOf(verse);
      return segment ? segment.top + (verse - segment.start + 0.5) * pixelsPerVerse : top;
    },
    verseAt: (position) => {
      const segment = segments.find(
        (candidate) => position >= candidate.top && position <= candidate.bottom,
      );
      if (!segment || pixelsPerVerse === 0) {
        return null;
      }
      const offset = Math.floor((position - segment.top) / pixelsPerVerse);
      return Math.min(segment.start + Math.max(offset, 0), segment.end);
    },
  };
}
