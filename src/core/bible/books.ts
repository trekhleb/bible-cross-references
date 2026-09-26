export type Testament = 'OT' | 'NT';

interface BookDefinition {
  /** OSIS book ID, e.g. `Gen`, `1Cor` (https://crosswire.org/osis/). */
  readonly id: string;
  /** Full English name, e.g. `Genesis`. */
  readonly name: string;
  /** Name used when citing a single passage, if it differs from `name` (e.g. `Psalm 23:1`). */
  readonly referenceName?: string;
  readonly testament: Testament;
  /** Extra spellings accepted when parsing user input, normalized (lowercase, no spaces or dots). */
  readonly aliases: readonly string[];
}

/**
 * The 66 books of the Protestant canon, in canonical order.
 *
 * Book IDs follow the OSIS standard, which is also what the OpenBible.info
 * cross-reference dataset uses.
 */
const BOOK_DEFINITIONS = [
  { id: 'Gen', name: 'Genesis', testament: 'OT', aliases: ['ge', 'gn'] },
  { id: 'Exod', name: 'Exodus', testament: 'OT', aliases: ['ex', 'exo'] },
  { id: 'Lev', name: 'Leviticus', testament: 'OT', aliases: ['le', 'lv'] },
  { id: 'Num', name: 'Numbers', testament: 'OT', aliases: ['nu', 'nm', 'nb'] },
  { id: 'Deut', name: 'Deuteronomy', testament: 'OT', aliases: ['de', 'dt', 'deu'] },
  { id: 'Josh', name: 'Joshua', testament: 'OT', aliases: ['jos', 'jsh'] },
  { id: 'Judg', name: 'Judges', testament: 'OT', aliases: ['jdg', 'jg', 'jdgs'] },
  { id: 'Ruth', name: 'Ruth', testament: 'OT', aliases: ['ru', 'rth'] },
  { id: '1Sam', name: '1 Samuel', testament: 'OT', aliases: ['1sa', '1sm'] },
  { id: '2Sam', name: '2 Samuel', testament: 'OT', aliases: ['2sa', '2sm'] },
  { id: '1Kgs', name: '1 Kings', testament: 'OT', aliases: ['1ki', '1kg'] },
  { id: '2Kgs', name: '2 Kings', testament: 'OT', aliases: ['2ki', '2kg'] },
  { id: '1Chr', name: '1 Chronicles', testament: 'OT', aliases: ['1ch', '1chron'] },
  { id: '2Chr', name: '2 Chronicles', testament: 'OT', aliases: ['2ch', '2chron'] },
  { id: 'Ezra', name: 'Ezra', testament: 'OT', aliases: ['ezr'] },
  { id: 'Neh', name: 'Nehemiah', testament: 'OT', aliases: ['ne'] },
  { id: 'Esth', name: 'Esther', testament: 'OT', aliases: ['es', 'est'] },
  { id: 'Job', name: 'Job', testament: 'OT', aliases: ['jb'] },
  {
    id: 'Ps',
    name: 'Psalms',
    referenceName: 'Psalm',
    testament: 'OT',
    aliases: ['psa', 'psm', 'pss'],
  },
  { id: 'Prov', name: 'Proverbs', testament: 'OT', aliases: ['pr', 'pro', 'prv'] },
  { id: 'Eccl', name: 'Ecclesiastes', testament: 'OT', aliases: ['ec', 'ecc', 'qoh'] },
  {
    id: 'Song',
    name: 'Song of Solomon',
    testament: 'OT',
    aliases: ['sng', 'sos', 'songofsongs', 'canticles'],
  },
  { id: 'Isa', name: 'Isaiah', testament: 'OT', aliases: ['is'] },
  { id: 'Jer', name: 'Jeremiah', testament: 'OT', aliases: ['je', 'jr'] },
  { id: 'Lam', name: 'Lamentations', testament: 'OT', aliases: ['la'] },
  { id: 'Ezek', name: 'Ezekiel', testament: 'OT', aliases: ['eze', 'ezk'] },
  { id: 'Dan', name: 'Daniel', testament: 'OT', aliases: ['da', 'dn'] },
  { id: 'Hos', name: 'Hosea', testament: 'OT', aliases: ['ho'] },
  { id: 'Joel', name: 'Joel', testament: 'OT', aliases: ['jl'] },
  { id: 'Amos', name: 'Amos', testament: 'OT', aliases: ['am'] },
  { id: 'Obad', name: 'Obadiah', testament: 'OT', aliases: ['ob', 'oba'] },
  { id: 'Jonah', name: 'Jonah', testament: 'OT', aliases: ['jon', 'jnh'] },
  { id: 'Mic', name: 'Micah', testament: 'OT', aliases: ['mi', 'mc'] },
  { id: 'Nah', name: 'Nahum', testament: 'OT', aliases: ['na'] },
  { id: 'Hab', name: 'Habakkuk', testament: 'OT', aliases: ['hb'] },
  { id: 'Zeph', name: 'Zephaniah', testament: 'OT', aliases: ['zep', 'zp'] },
  { id: 'Hag', name: 'Haggai', testament: 'OT', aliases: ['hg'] },
  { id: 'Zech', name: 'Zechariah', testament: 'OT', aliases: ['zec', 'zc'] },
  { id: 'Mal', name: 'Malachi', testament: 'OT', aliases: ['ml'] },
  { id: 'Matt', name: 'Matthew', testament: 'NT', aliases: ['mt', 'mat'] },
  { id: 'Mark', name: 'Mark', testament: 'NT', aliases: ['mk', 'mr', 'mrk'] },
  { id: 'Luke', name: 'Luke', testament: 'NT', aliases: ['lk', 'luk'] },
  { id: 'John', name: 'John', testament: 'NT', aliases: ['jn', 'jhn', 'joh'] },
  { id: 'Acts', name: 'Acts', testament: 'NT', aliases: ['ac', 'act'] },
  { id: 'Rom', name: 'Romans', testament: 'NT', aliases: ['ro', 'rm'] },
  { id: '1Cor', name: '1 Corinthians', testament: 'NT', aliases: ['1co'] },
  { id: '2Cor', name: '2 Corinthians', testament: 'NT', aliases: ['2co'] },
  { id: 'Gal', name: 'Galatians', testament: 'NT', aliases: ['ga'] },
  { id: 'Eph', name: 'Ephesians', testament: 'NT', aliases: ['ephes'] },
  { id: 'Phil', name: 'Philippians', testament: 'NT', aliases: ['php', 'pp'] },
  { id: 'Col', name: 'Colossians', testament: 'NT', aliases: [] },
  { id: '1Thess', name: '1 Thessalonians', testament: 'NT', aliases: ['1th', '1thes', '1ts'] },
  { id: '2Thess', name: '2 Thessalonians', testament: 'NT', aliases: ['2th', '2thes', '2ts'] },
  { id: '1Tim', name: '1 Timothy', testament: 'NT', aliases: ['1ti', '1tm'] },
  { id: '2Tim', name: '2 Timothy', testament: 'NT', aliases: ['2ti', '2tm'] },
  { id: 'Titus', name: 'Titus', testament: 'NT', aliases: ['ti', 'tit'] },
  { id: 'Phlm', name: 'Philemon', testament: 'NT', aliases: ['phm', 'pm', 'philem'] },
  { id: 'Heb', name: 'Hebrews', testament: 'NT', aliases: ['he'] },
  { id: 'Jas', name: 'James', testament: 'NT', aliases: ['jm', 'jam'] },
  { id: '1Pet', name: '1 Peter', testament: 'NT', aliases: ['1pe', '1pt'] },
  { id: '2Pet', name: '2 Peter', testament: 'NT', aliases: ['2pe', '2pt'] },
  { id: '1John', name: '1 John', testament: 'NT', aliases: ['1jn', '1jo', '1jhn'] },
  { id: '2John', name: '2 John', testament: 'NT', aliases: ['2jn', '2jo', '2jhn'] },
  { id: '3John', name: '3 John', testament: 'NT', aliases: ['3jn', '3jo', '3jhn'] },
  { id: 'Jude', name: 'Jude', testament: 'NT', aliases: ['jud', 'jd'] },
  { id: 'Rev', name: 'Revelation', testament: 'NT', aliases: ['re', 'rv', 'apocalypse'] },
] as const satisfies readonly BookDefinition[];

export type BookId = (typeof BOOK_DEFINITIONS)[number]['id'];

export interface Book extends BookDefinition {
  readonly id: BookId;
  /** Zero-based position of the book in canonical order. */
  readonly ordinal: number;
}

export const BOOKS: readonly Book[] = BOOK_DEFINITIONS.map((definition, ordinal) => ({
  ...definition,
  ordinal,
}));

const BOOKS_BY_ID: ReadonlyMap<string, Book> = new Map(BOOKS.map((book) => [book.id, book]));

export function isBookId(value: string): value is BookId {
  return BOOKS_BY_ID.has(value);
}

export function getBook(id: BookId): Book {
  const book = BOOKS_BY_ID.get(id);
  if (!book) {
    throw new RangeError(`Unknown book ID: ${id}`);
  }
  return book;
}

/** The name to use when citing a passage from the book, e.g. `Psalm` rather than `Psalms`. */
export function getReferenceName(book: Book): string {
  return book.referenceName ?? book.name;
}
