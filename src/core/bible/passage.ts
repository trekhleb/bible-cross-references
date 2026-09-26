import { getBook, getReferenceName, isBookId, type BookId } from './books.ts';
import type { ParsedReference } from './reference-parse.ts';
import { toOsisId, parseOsisId, type VerseIndex } from './verse-ref.ts';
import type { VerseIndexRange, Versification } from './versification.ts';

/** What a reader is looking at: a single verse or a whole chapter. */
export type Passage =
  | { readonly kind: 'verse'; readonly verse: VerseIndex }
  | { readonly kind: 'chapter'; readonly book: BookId; readonly chapter: number };

const OSIS_CHAPTER_ID_PATTERN = /^([1-3]?[A-Za-z]+)\.(\d+)$/;

export function versePassage(verse: VerseIndex): Passage {
  return { kind: 'verse', verse };
}

/** The chapter containing a verse. */
export function chapterPassageOf(verse: VerseIndex, versification: Versification): Passage {
  const { book, chapter } = versification.refAt(verse);
  return { kind: 'chapter', book, chapter };
}

/** Inclusive verse-index range of the passage. */
export function passageRange(passage: Passage, versification: Versification): VerseIndexRange {
  if (passage.kind === 'verse') {
    return { start: passage.verse, end: passage.verse };
  }
  const range = versification.chapterRange(passage.book, passage.chapter);
  if (!range) {
    throw new RangeError(`No such chapter: ${passage.book} ${passage.chapter}`);
  }
  return range;
}

export function isSamePassage(a: Passage | null, b: Passage | null): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  if (a.kind === 'verse' || b.kind === 'verse') {
    return a.kind === 'verse' && b.kind === 'verse' && a.verse === b.verse;
  }
  return a.book === b.book && a.chapter === b.chapter;
}

/** Formats a passage for display, e.g. `Isaiah 53` or `Isaiah 53:5`. */
export function formatPassage(passage: Passage, versification: Versification): string {
  if (passage.kind === 'verse') {
    const ref = versification.refAt(passage.verse);
    return `${getReferenceName(getBook(ref.book))} ${ref.chapter}:${ref.verse}`;
  }
  return `${getReferenceName(getBook(passage.book))} ${passage.chapter}`;
}

/** Formats a passage as an OSIS ID, e.g. `Isa.53` or `Isa.53.5`. */
export function toPassageOsisId(passage: Passage, versification: Versification): string {
  return passage.kind === 'verse'
    ? toOsisId(versification.refAt(passage.verse))
    : `${passage.book}.${passage.chapter}`;
}

/** Parses an OSIS verse (`Isa.53.5`) or chapter (`Isa.53`) ID that exists in the versification. */
export function parsePassageOsisId(id: string, versification: Versification): Passage | undefined {
  const verseRef = parseOsisId(id);
  if (verseRef) {
    const verse = versification.indexOf(verseRef);
    return verse === undefined ? undefined : versePassage(verse);
  }
  const match = OSIS_CHAPTER_ID_PATTERN.exec(id);
  const [, book = '', chapterText = ''] = match ?? [];
  if (!match || !isBookId(book)) {
    return undefined;
  }
  const chapter = Number(chapterText);
  return versification.verseCountOf(book, chapter) === undefined
    ? undefined
    : { kind: 'chapter', book, chapter };
}

/** Converts a validated user reference (`John 3` or `John 3:16`) into a passage. */
export function passageFromReference(
  reference: ParsedReference,
  versification: Versification,
): Passage {
  const { book, chapter, verse } = reference;
  if (verse === undefined) {
    return { kind: 'chapter', book, chapter };
  }
  const index = versification.indexOf({ book, chapter, verse });
  if (index === undefined) {
    throw new RangeError(`No such verse: ${book} ${chapter}:${verse}`);
  }
  return versePassage(index);
}
