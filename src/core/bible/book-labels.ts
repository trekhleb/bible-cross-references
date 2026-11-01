import { SLOVENIAN_BOOKS } from '../../locales/sl/books.ts';
import { selectedTranslation } from '../../translations/selection.ts';
import { getReferenceName, type Book } from './books.ts';

/** Display labels follow the selected Bible's language; canonical book data stays English. */
export function getDisplayBookName(book: Book, language = selectedTranslation().language): string {
  return language === 'sl' ? SLOVENIAN_BOOKS[book.id].name : book.name;
}

export function getDisplayReferenceName(
  book: Book,
  language = selectedTranslation().language,
): string {
  if (language !== 'sl') return getReferenceName(book);
  return book.id === 'Ps' ? 'Psalm' : SLOVENIAN_BOOKS[book.id].name;
}
