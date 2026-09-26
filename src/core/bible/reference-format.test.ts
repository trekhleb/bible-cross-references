import { describe, expect, it } from 'vitest';
import { formatVerseIndexRange, formatVerseRange, formatVerseRef } from './reference-format.ts';
import { KJV_VERSIFICATION } from './versification.ts';

describe('reference formatting', () => {
  it('formats single verses', () => {
    expect(formatVerseRef({ book: 'Gen', chapter: 1, verse: 1 })).toBe('Genesis 1:1');
    expect(formatVerseRef({ book: 'Ps', chapter: 23, verse: 4 })).toBe('Psalm 23:4');
  });

  it('formats ranges compactly', () => {
    const range = (start: [number, number], end: [number, number]) =>
      formatVerseRange(
        { book: 'Gen', chapter: start[0], verse: start[1] },
        { book: 'Gen', chapter: end[0], verse: end[1] },
      );
    expect(range([1, 1], [1, 1])).toBe('Genesis 1:1');
    expect(range([1, 1], [1, 3])).toBe('Genesis 1:1–3');
    expect(range([1, 31], [2, 3])).toBe('Genesis 1:31–2:3');
    expect(
      formatVerseRange(
        { book: 'Gen', chapter: 50, verse: 26 },
        { book: 'Exod', chapter: 1, verse: 1 },
      ),
    ).toBe('Genesis 50:26 – Exodus 1:1');
  });

  it('formats index ranges', () => {
    expect(formatVerseIndexRange(KJV_VERSIFICATION, 0, 2)).toBe('Genesis 1:1–3');
    expect(formatVerseIndexRange(KJV_VERSIFICATION, 31101)).toBe('Revelation 22:21');
  });
});
