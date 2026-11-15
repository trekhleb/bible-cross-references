import { BOOKS, type Book } from './books.ts';
import type { BookNames } from '../../i18n/books/types.ts';

export type BookLookupResult =
  | { readonly kind: 'found'; readonly book: Book }
  | { readonly kind: 'ambiguous'; readonly candidates: readonly Book[] }
  | { readonly kind: 'unknown' };

/**
 * Letters that carry no accent to strip, so `foldBookName`'s decompose-and-drop-the-marks pass
 * leaves them untouched and an unaccented spelling never reaches the book. Turkish `ı` is not
 * `i` with something removed, it is its own letter; the same is true of the rest of these.
 */
const FOLDED_LETTERS: readonly (readonly [RegExp, string])[] = [
  [/ı/g, 'i'],
  [/ß/g, 'ss'],
  [/ø/g, 'o'],
  [/ł/g, 'l'],
  [/đ/g, 'd'],
  [/æ/g, 'ae'],
  [/œ/g, 'oe'],
];

/**
 * Normalizes a book name for lookup: composed (NFC), lowercase, a leading roman numeral followed
 * by a space turned into a digit ("II Kings" → "2kings"), and the punctuation that only ever
 * separates parts of a name removed: spaces, dots, hyphens, apostrophes in any of the shapes a
 * keyboard produces, and the ordinal markers Portuguese writes after a numeral ("1º Coríntios").
 * Dropping them means a reader may type the apostrophe or leave it out. Accents are kept.
 *
 * The NFC pass matters because the same accented letter has two spellings in Unicode — `ó` as one
 * code point, or `o` followed by a combining acute — and text pasted from macOS or a PDF often
 * carries the second. Both have to land on the same key or `Jó 1:1` misses a book it names.
 */
export function normalizeBookName(value: string): string {
  return value
    .normalize('NFC')
    .trim()
    .toLowerCase()
    .replace(/^(i{1,3})\.?\s+/, (_match: string, numeral: string) => String(numeral.length))
    .replace(/[\s.\-'’‘ʼº°ª]+/gu, '');
}

/**
 * The same, with the accents folded away, which is how people type on a phone: `genesis` for
 * `Gênesis`, `josue` for `Josué`. It is a second pass rather than the only one, because in
 * Portuguese the accent is the whole difference between two books — `Jó` is Job and `Jo` is the
 * usual abbreviation for João. Matching what was actually typed first keeps both.
 */
export function foldBookName(value: string): string {
  let folded = normalizeBookName(value);
  for (const [pattern, replacement] of FOLDED_LETTERS) {
    folded = folded.replace(pattern, replacement);
  }
  return folded.normalize('NFD').replace(/\p{M}+/gu, '');
}

interface BookIndex {
  /** Keyed on what was typed, accents and all. */
  readonly exact: ReadonlyMap<string, Book>;
  /** Keyed on the accent-folded form; a key two books share is dropped rather than guessed. */
  readonly folded: ReadonlyMap<string, Book>;
  /** Spellings that folding brings together, which therefore have to be typed with their accents. */
  readonly contested: readonly string[];
  readonly byName: readonly { readonly book: Book; readonly names: readonly string[] }[];
  /** Spellings two books both claim. Empty for every catalogue the app ships; see below. */
  readonly collisions: readonly string[];
}

function namesOf(book: Book, names: BookNames): string[] {
  const localized = names[book.id];
  return [localized.name, localized.referenceName ?? localized.name];
}

function buildIndex(names: BookNames): BookIndex {
  const exact = new Map<string, Book>();
  const folded = new Map<string, Book>();
  const contested = new Set<string>();
  const collisions = new Set<string>();
  for (const book of BOOKS) {
    const spellings = [
      book.id,
      ...namesOf(book, names),
      names[book.id].abbreviation ?? book.id,
      ...names[book.id].aliases,
    ];
    for (const spelling of spellings) {
      const key = normalizeBookName(spelling);
      const existing = exact.get(key);
      if (existing && existing !== book) {
        // A catalogue should never do this, and `bookNameCollisions` fails the build when one
        // does. At run time the first book keeps the spelling rather than the app throwing:
        // this is reached from the search box's submit handler, outside any error boundary, so
        // throwing here would not show a message — it would just make the search stop working.
        collisions.add(`${key}: ${existing.id} and ${book.id}`);
        continue;
      }
      exact.set(key, book);

      // Folding can bring two books together that their accents keep apart. Where it does, the
      // folded spelling belongs to neither: the reader falls through to the prefix search, which
      // says what it could have been instead of picking one.
      const loose = foldBookName(spelling);
      const sharing = folded.get(loose);
      if (sharing && sharing !== book) {
        contested.add(loose);
      }
      folded.set(loose, book);
    }
  }
  for (const key of contested) {
    folded.delete(key);
  }
  return {
    exact,
    folded,
    contested: [...contested].toSorted(),
    byName: BOOKS.map((book) => ({ book, names: namesOf(book, names).map(foldBookName) })),
    // A book's id, name, reference name and abbreviation often share one spelling, so the same
    // clash is met several times over; the reader of this list wants it once.
    collisions: [...collisions],
  };
}

/**
 * Spellings two different books both claim in a catalogue, as `"key: bookA and bookB"`.
 *
 * Always empty for a correct catalogue. A test asserts that for every language the app ships, so
 * a translator who gives Jonah an alias John already answers to finds out in CI rather than
 * through readers landing on the wrong book.
 */
export function bookNameCollisions(names: BookNames): readonly string[] {
  return indexFor(names).collisions;
}

/**
 * The spellings in a catalogue that two books share once their accents are folded away, e.g. `jo`
 * in Portuguese, which `Jó` (Job) and `Jo` (João) both reach.
 *
 * These are the spellings where the accent is the whole of the meaning, so typing one without it
 * cannot be answered — the reader is shown the candidates instead. They are also the cases a
 * language's acceptance table has to pin (see `src/i18n/books/acceptance.ts`): a collision is
 * resolved by whichever book claims the unaccented spelling exactly, and nothing else in the
 * build would notice if that ever changed hands.
 */
export function contestedSpellings(names: BookNames): readonly string[] {
  return indexFor(names).contested;
}

// One index per set of names, built the first time that language is used.
const indices = new WeakMap<BookNames, BookIndex>();

function indexFor(names: BookNames): BookIndex {
  const existing = indices.get(names);
  if (existing) {
    return existing;
  }
  const built = buildIndex(names);
  indices.set(names, built);
  return built;
}

/**
 * Finds a book by name, OSIS ID or common abbreviation, in one language.
 *
 * Exact matches win; otherwise the query is matched as a prefix of the full book names, so
 * "gene" finds Genesis while "jo" is reported as ambiguous. In Portuguese "jó" is a whole name,
 * so it is found exactly rather than competing with João, Joel, Jonas and Josué.
 */
export function lookupBook(query: string, names: BookNames): BookLookupResult {
  const key = normalizeBookName(query);
  if (key === '') {
    return { kind: 'unknown' };
  }
  const index = indexFor(names);
  const exactMatch = index.exact.get(key) ?? index.folded.get(foldBookName(query));
  if (exactMatch) {
    return { kind: 'found', book: exactMatch };
  }
  const loose = foldBookName(query);
  const candidates = index.byName
    .filter(({ names: bookNames }) => bookNames.some((name) => name.startsWith(loose)))
    .map(({ book }) => book);
  const [onlyCandidate] = candidates;
  if (candidates.length === 1 && onlyCandidate) {
    return { kind: 'found', book: onlyCandidate };
  }
  return candidates.length === 0 ? { kind: 'unknown' } : { kind: 'ambiguous', candidates };
}
