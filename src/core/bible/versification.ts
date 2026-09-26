import { elementAt } from '../lib/array.ts';
import { BOOKS, type Book, type BookId } from './books.ts';
import { KJV_CHAPTER_VERSE_COUNTS } from './kjv-versification.ts';
import type { VerseIndex, VerseRef } from './verse-ref.ts';

export type VersificationId = 'kjv';

/** An inclusive range of verse indices. */
export interface VerseIndexRange {
  readonly start: VerseIndex;
  readonly end: VerseIndex;
}

/**
 * A versification scheme: how the books are divided into chapters and verses.
 *
 * Maps between human-readable verse references and dense, zero-based verse indices in canonical
 * order. All lookups are O(1).
 */
export class Versification {
  readonly id: VersificationId;
  readonly verseCount: number;
  readonly chapterCount: number;

  readonly #chapterVerseCounts: Readonly<Record<BookId, readonly number[]>>;
  /** For each book: the verse index at which each of its chapters starts. */
  readonly #chapterStarts: ReadonlyMap<BookId, readonly VerseIndex[]>;
  readonly #bookRanges: ReadonlyMap<BookId, VerseIndexRange>;
  /** For each verse index: its book ordinal, chapter number and verse number. */
  readonly #verseBookOrdinals: Uint8Array;
  readonly #verseChapters: Uint8Array;
  readonly #verseNumbers: Uint8Array;

  constructor(
    id: VersificationId,
    chapterVerseCounts: Readonly<Record<BookId, readonly number[]>>,
  ) {
    this.id = id;
    this.#chapterVerseCounts = chapterVerseCounts;

    const chapterStarts = new Map<BookId, VerseIndex[]>();
    const bookRanges = new Map<BookId, VerseIndexRange>();
    let verseCount = 0;
    let chapterCount = 0;
    for (const book of BOOKS) {
      const counts = chapterVerseCounts[book.id];
      if (counts.length === 0 || counts.some((count) => !Number.isInteger(count) || count < 1)) {
        throw new RangeError(`Versification "${id}": invalid chapter verse counts for ${book.id}.`);
      }
      const starts: VerseIndex[] = [];
      const bookStart = verseCount;
      for (const count of counts) {
        starts.push(verseCount);
        verseCount += count;
      }
      chapterStarts.set(book.id, starts);
      bookRanges.set(book.id, { start: bookStart, end: verseCount - 1 });
      chapterCount += counts.length;
    }

    this.verseCount = verseCount;
    this.chapterCount = chapterCount;
    this.#chapterStarts = chapterStarts;
    this.#bookRanges = bookRanges;

    // Chapter and verse numbers of real versifications fit in a byte (max 150 and 176).
    this.#verseBookOrdinals = new Uint8Array(verseCount);
    this.#verseChapters = new Uint8Array(verseCount);
    this.#verseNumbers = new Uint8Array(verseCount);
    let index = 0;
    for (const book of BOOKS) {
      chapterVerseCounts[book.id].forEach((count, chapterOffset) => {
        for (let verse = 1; verse <= count; verse += 1) {
          this.#verseBookOrdinals[index] = book.ordinal;
          this.#verseChapters[index] = chapterOffset + 1;
          this.#verseNumbers[index] = verse;
          index += 1;
        }
      });
    }
  }

  chapterCountOf(book: BookId): number {
    return this.#chapterVerseCounts[book].length;
  }

  /** Number of verses in the chapter, or `undefined` if the book has no such chapter. */
  verseCountOf(book: BookId, chapter: number): number | undefined {
    return this.#chapterVerseCounts[book][chapter - 1];
  }

  /** Index of the verse, or `undefined` if the verse does not exist in this versification. */
  indexOf(ref: VerseRef): VerseIndex | undefined {
    const verseCount = this.verseCountOf(ref.book, ref.chapter);
    if (verseCount === undefined || !Number.isInteger(ref.verse)) {
      return undefined;
    }
    if (ref.verse < 1 || ref.verse > verseCount) {
      return undefined;
    }
    const chapterStart = elementAt(this.#getChapterStarts(ref.book), ref.chapter - 1);
    return chapterStart + ref.verse - 1;
  }

  /** Reference of the verse at `index`. Throws if the index is out of range. */
  refAt(index: VerseIndex): VerseRef {
    return {
      book: this.bookAt(index).id,
      chapter: elementAt(this.#verseChapters, index),
      verse: elementAt(this.#verseNumbers, index),
    };
  }

  /** The book containing the verse at `index`. Throws if the index is out of range. */
  bookAt(index: VerseIndex): Book {
    return elementAt(BOOKS, elementAt(this.#verseBookOrdinals, index));
  }

  /** The inclusive index range covered by a chapter, or `undefined` if it does not exist. */
  chapterRange(book: BookId, chapter: number): VerseIndexRange | undefined {
    const verseCount = this.verseCountOf(book, chapter);
    if (verseCount === undefined) {
      return undefined;
    }
    const start = elementAt(this.#getChapterStarts(book), chapter - 1);
    return { start, end: start + verseCount - 1 };
  }

  /** The inclusive index range covered by the book. */
  bookRange(book: BookId): VerseIndexRange {
    const range = this.#bookRanges.get(book);
    if (!range) {
      throw new RangeError(`Unknown book ID: ${book}`);
    }
    return range;
  }

  isValidIndex(index: number): index is VerseIndex {
    return Number.isInteger(index) && index >= 0 && index < this.verseCount;
  }

  #getChapterStarts(book: BookId): readonly VerseIndex[] {
    const starts = this.#chapterStarts.get(book);
    if (!starts) {
      throw new RangeError(`Unknown book ID: ${book}`);
    }
    return starts;
  }
}

export const KJV_VERSIFICATION = new Versification('kjv', KJV_CHAPTER_VERSE_COUNTS);

/**
 * The project's canonical coordinate system. Cross-references, analytics, URLs and stored user
 * state are expressed in it, independently of the translation being displayed.
 */
export const CANONICAL_VERSIFICATION = KJV_VERSIFICATION;
