import { BOOKS, getReferenceName, type Book } from './books.ts';

export type BookLookupResult =
  | { readonly kind: 'found'; readonly book: Book }
  | { readonly kind: 'ambiguous'; readonly candidates: readonly Book[] }
  | { readonly kind: 'unknown' };

/**
 * Normalizes a book name for lookup: lowercase, a leading roman numeral followed by a space turned
 * into a digit ("II Kings" → "2kings"), spaces and dots removed.
 */
export function normalizeBookName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^(i{1,3})\s+/, (_match: string, numeral: string) => String(numeral.length))
    .replace(/[\s.]+/g, '');
}

function bookNames(book: Book): string[] {
  return [book.name, getReferenceName(book)];
}

function buildExactIndex(): ReadonlyMap<string, Book> {
  const index = new Map<string, Book>();
  for (const book of BOOKS) {
    const keys = [book.id, ...bookNames(book), ...book.aliases].map(normalizeBookName);
    for (const key of keys) {
      const existing = index.get(key);
      if (existing && existing !== book) {
        throw new Error(`Book name "${key}" is ambiguous: ${existing.id} and ${book.id}.`);
      }
      index.set(key, book);
    }
  }
  return index;
}

const EXACT_INDEX = buildExactIndex();

const NORMALIZED_NAMES: readonly { readonly book: Book; readonly names: readonly string[] }[] =
  BOOKS.map((book) => ({ book, names: bookNames(book).map(normalizeBookName) }));

/**
 * Finds a book by name, OSIS ID or common abbreviation (case-insensitive).
 *
 * Exact matches win; otherwise the query is matched as a prefix of the full book names, so
 * "gene" finds Genesis while "jo" is reported as ambiguous.
 */
export function lookupBook(query: string): BookLookupResult {
  const key = normalizeBookName(query);
  if (key === '') {
    return { kind: 'unknown' };
  }

  const exactMatch = EXACT_INDEX.get(key);
  if (exactMatch) {
    return { kind: 'found', book: exactMatch };
  }

  const candidates = NORMALIZED_NAMES.filter(({ names }) =>
    names.some((name) => name.startsWith(key)),
  ).map(({ book }) => book);
  const [onlyCandidate] = candidates;
  if (candidates.length === 1 && onlyCandidate) {
    return { kind: 'found', book: onlyCandidate };
  }
  return candidates.length === 0 ? { kind: 'unknown' } : { kind: 'ambiguous', candidates };
}
