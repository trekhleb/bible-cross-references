import { describe, expect, it } from 'vitest';
import { KJV_VERSIFICATION } from './versification.ts';

describe('KJV versification', () => {
  const kjv = KJV_VERSIFICATION;

  it('has the standard chapter and verse counts', () => {
    expect(kjv.chapterCount).toBe(1189);
    expect(kjv.verseCount).toBe(31102);
    expect(kjv.chapterCountOf('Ps')).toBe(150);
    expect(kjv.verseCountOf('Ps', 119)).toBe(176);
    expect(kjv.verseCountOf('Gen', 51)).toBeUndefined();
  });

  it('maps references to dense indices in canonical order', () => {
    expect(kjv.indexOf({ book: 'Gen', chapter: 1, verse: 1 })).toBe(0);
    expect(kjv.indexOf({ book: 'Gen', chapter: 2, verse: 1 })).toBe(31);
    expect(kjv.indexOf({ book: 'Rev', chapter: 22, verse: 21 })).toBe(31101);
  });

  it('rejects verses that do not exist', () => {
    expect(kjv.indexOf({ book: 'Gen', chapter: 1, verse: 32 })).toBeUndefined();
    expect(kjv.indexOf({ book: 'Gen', chapter: 0, verse: 1 })).toBeUndefined();
    expect(kjv.indexOf({ book: '3John', chapter: 1, verse: 15 })).toBeUndefined();
  });

  it('round-trips every index', () => {
    for (let index = 0; index < kjv.verseCount; index += 1) {
      expect(kjv.indexOf(kjv.refAt(index))).toBe(index);
    }
  });

  it('reports book membership and ranges', () => {
    const matthew = kjv.bookRange('Matt');
    expect(kjv.bookAt(matthew.start).id).toBe('Matt');
    expect(kjv.bookAt(matthew.start - 1).id).toBe('Mal');
    expect(kjv.refAt(matthew.end)).toEqual({ book: 'Matt', chapter: 28, verse: 20 });
  });

  it('throws for out-of-range indices', () => {
    expect(() => kjv.refAt(-1)).toThrow(RangeError);
    expect(() => kjv.refAt(kjv.verseCount)).toThrow(RangeError);
  });
});
