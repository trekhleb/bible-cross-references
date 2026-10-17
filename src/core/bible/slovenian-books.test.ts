import { SLOVENIAN_BOOK_ABBREVIATIONS } from '../../locales/sl/book-abbreviations.ts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SLOVENIAN_BOOKS } from '../../locales/sl/books.ts';
import { BOOKS, getBook } from './books.ts';
import { getDisplayBookName } from './book-labels.ts';
import { parseReference } from './reference-parse.ts';
import { formatVerseRef } from './reference-format.ts';
import { formatPassage, toPassageOsisId } from './passage.ts';
import { CANONICAL_VERSIFICATION } from './versification.ts';

afterEach(() => vi.unstubAllGlobals());

describe('Slovenian book labels', () => {
  it('covers all 66 stable book IDs and retains the source headings', () => {
    expect(Object.keys(SLOVENIAN_BOOKS)).toEqual(BOOKS.map((book) => book.id));
    expect(SLOVENIAN_BOOKS.Gen.sourceTitle).toBe('Prva knjiga Mojzesova (Genesis)');
    expect(getDisplayBookName(getBook('Gen'), 'sl')).toBe('1. Mojzesova');
    expect(getDisplayBookName(getBook('Gen'), 'en')).toBe('Genesis');
  });
  it.each([
    ['1. Mojzesova 1:1', 'Gen'],
    ['1 Mz 1:1', 'Gen'],
    ['Prva knjiga Mojzesova 1:1', 'Gen'],
    ['Četrta Mojzesova 1:1', 'Num'],
    ['Cetrta Mojzesova 1:1', 'Num'],
    ['Žalostinke 1:1', 'Lam'],
    ['Zalostinke 1:1', 'Lam'],
    ['Matevž 1:1', 'Matt'],
    ['Matej 1:1', 'Matt'],
    ['Lukež 1:1', 'Luke'],
    ['Luka 1:1', 'Luke'],
    ['Janez 3:16', 'John'],
    ['1. Korinčanom 13:1', '1Cor'],
    ['II. Petrov list 1:1', '2Pet'],
    ['3 Jn 1:1', '3John'],
    ['Prva knjiga Samuelova 1:1', '1Sam'],
    ['Prva knjiga Kraljev 1:1', '1Kgs'],
    ['John 3:16', 'John'],
  ])('parses %s without changing canonical references', (input, book) => {
    const result = parseReference(input, CANONICAL_VERSIFICATION);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.reference.book).toBe(book);
  });
  it('localizes displayed references while keeping OSIS URLs unchanged', () => {
    vi.stubGlobal('location', { search: '?t=chr1914-sl' });
    expect(formatVerseRef({ book: 'Gen', chapter: 1, verse: 1 })).toBe('1. Mojzesova 1:1');
    const passage = { kind: 'chapter', book: 'John', chapter: 3 } as const;
    expect(formatPassage(passage, CANONICAL_VERSIFICATION)).toBe('Janez 3');
    expect(toPassageOsisId(passage, CANONICAL_VERSIFICATION)).toBe('John.3');
  });
});

// Each alias from the saved table must resolve unambiguously, including short forms.
it.each(
  Object.entries(SLOVENIAN_BOOK_ABBREVIATIONS).flatMap(([book, aliases]) =>
    aliases.map((alias) => [alias, book]),
  ),
)('resolves the supplied alias %s to %s', (alias, book) => {
  const result = parseReference(`${alias} 1:1`, CANONICAL_VERSIFICATION);
  expect(result.ok).toBe(true);
  if (result.ok) expect(result.reference.book).toBe(book);
});
