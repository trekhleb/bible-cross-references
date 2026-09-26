import { BOOKS, type BookId, type Testament } from './books.ts';

interface GenreDefinition {
  readonly id: string;
  readonly name: string;
  readonly testament: Testament;
}

/**
 * The standard Protestant grouping of the 66 books into 10 genres, in canonical order.
 * Every genre is a contiguous run of books, so genres can be laid out as segments or regions.
 */
const GENRE_DEFINITIONS = [
  { id: 'law', name: 'Law', testament: 'OT' },
  { id: 'history', name: 'History', testament: 'OT' },
  { id: 'poetry', name: 'Poetry & Wisdom', testament: 'OT' },
  { id: 'major-prophets', name: 'Major Prophets', testament: 'OT' },
  { id: 'minor-prophets', name: 'Minor Prophets', testament: 'OT' },
  { id: 'gospels', name: 'Gospels', testament: 'NT' },
  { id: 'acts', name: 'Acts', testament: 'NT' },
  { id: 'pauline-epistles', name: 'Pauline Epistles', testament: 'NT' },
  { id: 'general-epistles', name: 'General Epistles', testament: 'NT' },
  { id: 'revelation', name: 'Revelation', testament: 'NT' },
] as const satisfies readonly GenreDefinition[];

export type GenreId = (typeof GENRE_DEFINITIONS)[number]['id'];

export interface Genre extends GenreDefinition {
  readonly id: GenreId;
  /** Zero-based position of the genre in canonical order. */
  readonly ordinal: number;
}

export const GENRES: readonly Genre[] = GENRE_DEFINITIONS.map((definition, ordinal) => ({
  ...definition,
  ordinal,
}));

const BOOK_GENRES: Readonly<Record<BookId, GenreId>> = {
  Gen: 'law',
  Exod: 'law',
  Lev: 'law',
  Num: 'law',
  Deut: 'law',
  Josh: 'history',
  Judg: 'history',
  Ruth: 'history',
  '1Sam': 'history',
  '2Sam': 'history',
  '1Kgs': 'history',
  '2Kgs': 'history',
  '1Chr': 'history',
  '2Chr': 'history',
  Ezra: 'history',
  Neh: 'history',
  Esth: 'history',
  Job: 'poetry',
  Ps: 'poetry',
  Prov: 'poetry',
  Eccl: 'poetry',
  Song: 'poetry',
  Isa: 'major-prophets',
  Jer: 'major-prophets',
  Lam: 'major-prophets',
  Ezek: 'major-prophets',
  Dan: 'major-prophets',
  Hos: 'minor-prophets',
  Joel: 'minor-prophets',
  Amos: 'minor-prophets',
  Obad: 'minor-prophets',
  Jonah: 'minor-prophets',
  Mic: 'minor-prophets',
  Nah: 'minor-prophets',
  Hab: 'minor-prophets',
  Zeph: 'minor-prophets',
  Hag: 'minor-prophets',
  Zech: 'minor-prophets',
  Mal: 'minor-prophets',
  Matt: 'gospels',
  Mark: 'gospels',
  Luke: 'gospels',
  John: 'gospels',
  Acts: 'acts',
  Rom: 'pauline-epistles',
  '1Cor': 'pauline-epistles',
  '2Cor': 'pauline-epistles',
  Gal: 'pauline-epistles',
  Eph: 'pauline-epistles',
  Phil: 'pauline-epistles',
  Col: 'pauline-epistles',
  '1Thess': 'pauline-epistles',
  '2Thess': 'pauline-epistles',
  '1Tim': 'pauline-epistles',
  '2Tim': 'pauline-epistles',
  Titus: 'pauline-epistles',
  Phlm: 'pauline-epistles',
  Heb: 'general-epistles',
  Jas: 'general-epistles',
  '1Pet': 'general-epistles',
  '2Pet': 'general-epistles',
  '1John': 'general-epistles',
  '2John': 'general-epistles',
  '3John': 'general-epistles',
  Jude: 'general-epistles',
  Rev: 'revelation',
};

const GENRES_BY_ID: ReadonlyMap<GenreId, Genre> = new Map(GENRES.map((genre) => [genre.id, genre]));

export function getGenre(id: GenreId): Genre {
  const genre = GENRES_BY_ID.get(id);
  if (!genre) {
    throw new RangeError(`Unknown genre ID: ${id}`);
  }
  return genre;
}

export function getBookGenre(book: BookId): Genre {
  return getGenre(BOOK_GENRES[book]);
}

/** Books of a genre, in canonical order. */
export function getGenreBooks(id: GenreId): readonly BookId[] {
  return BOOKS.filter((book) => BOOK_GENRES[book.id] === id).map((book) => book.id);
}
