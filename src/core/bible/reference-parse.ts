import { t } from '../../locales/ui.ts';
import { getDisplayReferenceName, getDisplayBookName } from './book-labels.ts';
import { lookupBook } from './book-lookup.ts';
import { type BookId } from './books.ts';
import type { Versification } from './versification.ts';

/** A reference entered by a user: a whole chapter (no verse) or a single verse. */
export interface ParsedReference {
  readonly book: BookId;
  readonly chapter: number;
  readonly verse: number | undefined;
}

export type ReferenceParseResult =
  | { readonly ok: true; readonly reference: ParsedReference }
  | { readonly ok: false; readonly error: string };

/**
 * `<book> <chapter>[<separator><verse>]`, where the book may start with 1–5 or a roman numeral and
 * the separator is `:`, `.` or whitespace. Matches e.g. `John 3:16`, `1 Cor 13`, `Gen.1.1`.
 */
const REFERENCE_PATTERN =
  /^(?<book>(?:[1-5]\.?\s*)?\p{L}[\p{L}\s.]*?)\s*(?<chapter>\d+)(?:\s*[:.\s]\s*(?<verse>\d+))?$/iu;

function failure(error: string): ReferenceParseResult {
  return { ok: false, error };
}

function formatCandidates(names: readonly string[]): string {
  return names.length <= 1
    ? names.join('')
    : `${names.slice(0, -1).join(', ')} ${t('or')} ${names.slice(-1).join('')}`;
}

/**
 * Parses a human-typed Bible reference such as `John 3:16`, `jn 3 16`, `1co13` or `Gen.1.1`, and
 * checks that the chapter and verse exist in the given versification.
 */
export function parseReference(input: string, versification: Versification): ReferenceParseResult {
  const match = REFERENCE_PATTERN.exec(input.trim());
  if (!match?.groups) {
    return failure(t('Enter a reference like "John 3:16" or "Ps 23".'));
  }
  const { book: bookQuery = '', chapter: chapterText = '', verse: verseText } = match.groups;

  const lookup = lookupBook(bookQuery);
  switch (lookup.kind) {
    case 'unknown':
      return failure(t('Unknown book "{book}".', { book: bookQuery.trim() }));
    case 'ambiguous':
      return failure(
        t('"{book}" could be {candidates}.', {
          book: bookQuery.trim(),
          candidates: formatCandidates(lookup.candidates.map((book) => getDisplayBookName(book))),
        }),
      );
    case 'found':
      break;
  }

  const { book } = lookup;
  const chapter = Number(chapterText);
  const verseCount = versification.verseCountOf(book.id, chapter);
  if (verseCount === undefined) {
    return failure(
      t('{book} has {count} chapters.', {
        book: getDisplayBookName(book),
        count: versification.chapterCountOf(book.id),
      }),
    );
  }

  if (verseText === undefined) {
    return { ok: true, reference: { book: book.id, chapter, verse: undefined } };
  }
  const verse = Number(verseText);
  if (verse < 1 || verse > verseCount) {
    return failure(
      t('{book} {chapter} has {count} verses.', {
        book: getDisplayReferenceName(book),
        chapter,
        count: verseCount,
      }),
    );
  }
  return { ok: true, reference: { book: book.id, chapter, verse } };
}
