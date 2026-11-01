import { lookupBook } from './book-lookup.ts';
import type { BookId } from './books.ts';
import type { BookNames } from '../../i18n/books/types.ts';
import type { Versification } from './versification.ts';

/** A reference entered by a user: a whole chapter (no verse) or a single verse. */
export interface ParsedReference {
  readonly book: BookId;
  readonly chapter: number;
  readonly verse: number | undefined;
}

/**
 * Why a reference could not be read. The reasons are data rather than sentences: the words
 * belong to whichever language the reader is using, and this module has no business holding
 * English copy (see `describeReferenceError` in the search box).
 */
export type ReferenceParseError =
  | { readonly kind: 'unreadable' }
  | { readonly kind: 'unknown-book'; readonly query: string }
  | {
      readonly kind: 'ambiguous-book';
      readonly query: string;
      readonly candidates: readonly BookId[];
    }
  | { readonly kind: 'no-such-chapter'; readonly book: BookId; readonly chapters: number }
  | {
      readonly kind: 'no-such-verse';
      readonly book: BookId;
      readonly chapter: number;
      readonly verses: number;
    };

export type ReferenceParseResult =
  | { readonly ok: true; readonly reference: ParsedReference }
  | { readonly ok: false; readonly error: ReferenceParseError };

/**
 * `<book> <chapter>[<separator><verse>]`, where the book may start with 1–3 or a roman numeral and
 * the separator is `:`, `.` or whitespace. Matches e.g. `John 3:16`, `1 Cor 13`, `Gen.1.1`.
 *
 * The book is any letters, not only `a`–`z`: `Gênesis 1:1`, `João 3:16` and `Êxodo 3:14` are
 * what a Brazilian types, and an ASCII-only pattern turns all three away. It also allows:
 *
 * - combining marks (`\p{M}`), so a name pasted in decomposed form still matches — `João` can
 *   arrive as `o` plus a combining tilde, which is not a letter and would end the book here;
 * - apostrophes and hyphens, which several languages put inside a book's own name
 *   (`Mısır'dan Çıkış`, `Об'явлення`, `1-а Самуїлова`);
 * - the ordinal markers a numeral takes in Portuguese (`1º Coríntios`);
 * - the comma German and much of continental Europe put between chapter and verse (`Joh 3,16`).
 *   A comma cannot be part of a book name, so it can only ever mean the separator, and without
 *   it a German reader typing the citation their own Bible prints is told there is no such book.
 */
const REFERENCE_PATTERN =
  /^(?<book>(?:[1-5][º°ª]?[\s.-]*)?[\p{L}\p{M}][\p{L}\p{M}\s.'’‘ʼ-]*?)\s*(?<chapter>\d+)(?:\s*[:.,\s]\s*(?<verse>\d+))?$/iu;

/**
 * The book a reference names, as typed: `1º Coríntios 13` → `1º Coríntios`, `Joh 3,16` → `Joh`.
 * Empty when the string is not shaped like a reference at all.
 *
 * Read off `REFERENCE_PATTERN` rather than by stripping trailing digits, so that whatever the
 * parser accepts between a book and its numbers, this agrees. A second copy of that separator
 * list in `src/i18n/completeness.ts` fell out of step the day the comma was added here, and
 * every German acceptance case quietly stopped counting towards the spellings it is meant to
 * pin — passing, while the gate went on asking for rows that were already written.
 */
export function bookPartOf(typed: string): string {
  return REFERENCE_PATTERN.exec(typed.trim())?.groups?.['book']?.trim() ?? '';
}

function failure(error: ReferenceParseError): ReferenceParseResult {
  return { ok: false, error };
}

/**
 * Parses a human-typed Bible reference such as `John 3:16`, `jn 3 16`, `1co13`, `Gen.1.1` or
 * `Gênesis 1:1`, and checks that the chapter and verse exist in the given versification.
 */
export function parseReference(
  input: string,
  versification: Versification,
  names: BookNames,
): ReferenceParseResult {
  const match = REFERENCE_PATTERN.exec(input.trim());
  if (!match?.groups) {
    return failure({ kind: 'unreadable' });
  }
  const { book: bookQuery = '', chapter: chapterText = '', verse: verseText } = match.groups;

  const lookup = lookupBook(bookQuery, names);
  switch (lookup.kind) {
    case 'unknown':
      return failure({ kind: 'unknown-book', query: bookQuery.trim() });
    case 'ambiguous':
      return failure({
        kind: 'ambiguous-book',
        query: bookQuery.trim(),
        candidates: lookup.candidates.map((book) => book.id),
      });
    case 'found':
      break;
  }

  const { book } = lookup;
  const chapter = Number(chapterText);
  const verseCount = versification.verseCountOf(book.id, chapter);
  if (verseCount === undefined) {
    return failure({
      kind: 'no-such-chapter',
      book: book.id,
      chapters: versification.chapterCountOf(book.id),
    });
  }

  if (verseText === undefined) {
    return { ok: true, reference: { book: book.id, chapter, verse: undefined } };
  }
  const verse = Number(verseText);
  if (verse < 1 || verse > verseCount) {
    return failure({ kind: 'no-such-verse', book: book.id, chapter, verses: verseCount });
  }
  return { ok: true, reference: { book: book.id, chapter, verse } };
}
