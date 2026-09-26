import { describe, expect, it } from 'vitest';
import { BOOKS, getBook, getReferenceName, isBookId } from './books.ts';

describe('BOOKS', () => {
  it('lists the 66 books of the Protestant canon in order', () => {
    expect(BOOKS).toHaveLength(66);
    expect(BOOKS.filter((book) => book.testament === 'OT')).toHaveLength(39);
    expect(BOOKS.filter((book) => book.testament === 'NT')).toHaveLength(27);
    expect(BOOKS.at(0)?.id).toBe('Gen');
    expect(BOOKS.at(-1)?.id).toBe('Rev');
    expect(BOOKS.map((book) => book.ordinal)).toEqual(BOOKS.map((_, index) => index));
  });

  it('has unique IDs', () => {
    expect(new Set(BOOKS.map((book) => book.id)).size).toBe(BOOKS.length);
  });
});

describe('book helpers', () => {
  it('recognizes OSIS book IDs', () => {
    expect(isBookId('1Cor')).toBe(true);
    expect(isBookId('1Co')).toBe(false);
  });

  it('uses the singular name when citing Psalms', () => {
    expect(getReferenceName(getBook('Ps'))).toBe('Psalm');
    expect(getReferenceName(getBook('Gen'))).toBe('Genesis');
  });
});
