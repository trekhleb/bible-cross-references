import { describe, expect, it } from 'vitest';
import { lookupBook, normalizeBookName } from './book-lookup.ts';

function foundId(query: string): string | undefined {
  const result = lookupBook(query);
  return result.kind === 'found' ? result.book.id : undefined;
}

describe('normalizeBookName', () => {
  it('lowercases and drops spaces and dots', () => {
    expect(normalizeBookName(' 1 Cor. ')).toBe('1cor');
  });

  it('turns a leading roman numeral into a digit', () => {
    expect(normalizeBookName('II Kings')).toBe('2kings');
    expect(normalizeBookName('Isaiah')).toBe('isaiah');
  });
});

describe('lookupBook', () => {
  it.each([
    ['Genesis', 'Gen'],
    ['gen', 'Gen'],
    ['Psalm', 'Ps'],
    ['psalms', 'Ps'],
    ['1 Cor', '1Cor'],
    ['1co', '1Cor'],
    ['III John', '3John'],
    ['jn', 'John'],
    ['phil', 'Phil'],
    ['song of songs', 'Song'],
    ['rev', 'Rev'],
  ])('finds %s', (query, id) => {
    expect(foundId(query)).toBe(id);
  });

  it('matches unambiguous prefixes of full names', () => {
    expect(foundId('lamen')).toBe('Lam');
    expect(foundId('philem')).toBe('Phlm');
  });

  it('reports ambiguous prefixes with their candidates', () => {
    const result = lookupBook('jo');
    expect(result.kind).toBe('ambiguous');
    if (result.kind === 'ambiguous') {
      expect(result.candidates.map((book) => book.id)).toEqual([
        'Josh',
        'Job',
        'Joel',
        'Jonah',
        'John',
      ]);
    }
  });

  it('reports unknown names', () => {
    expect(lookupBook('xyz').kind).toBe('unknown');
    expect(lookupBook('').kind).toBe('unknown');
  });
});
