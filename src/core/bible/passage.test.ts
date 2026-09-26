import { describe, expect, it } from 'vitest';
import {
  chapterPassageOf,
  formatPassage,
  isSamePassage,
  parsePassageOsisId,
  passageFromReference,
  passageRange,
  toPassageOsisId,
  versePassage,
  type Passage,
} from './passage.ts';
import { KJV_VERSIFICATION as kjv } from './versification.ts';

const JOHN_3_16 = kjv.indexOf({ book: 'John', chapter: 3, verse: 16 }) ?? -1;
const ISAIAH_53: Passage = { kind: 'chapter', book: 'Isa', chapter: 53 };

describe('passages', () => {
  it('computes ranges', () => {
    expect(passageRange(versePassage(JOHN_3_16), kjv)).toEqual({
      start: JOHN_3_16,
      end: JOHN_3_16,
    });
    const range = passageRange(ISAIAH_53, kjv);
    expect(range.end - range.start + 1).toBe(12);
    expect(kjv.refAt(range.start)).toEqual({ book: 'Isa', chapter: 53, verse: 1 });
  });

  it('formats and round-trips OSIS IDs', () => {
    expect(formatPassage(versePassage(JOHN_3_16), kjv)).toBe('John 3:16');
    expect(formatPassage({ kind: 'chapter', book: 'Ps', chapter: 23 }, kjv)).toBe('Psalm 23');
    expect(toPassageOsisId(ISAIAH_53, kjv)).toBe('Isa.53');
    expect(parsePassageOsisId('Isa.53', kjv)).toEqual(ISAIAH_53);
    expect(parsePassageOsisId('John.3.16', kjv)).toEqual(versePassage(JOHN_3_16));
  });

  it('rejects IDs that do not exist', () => {
    expect(parsePassageOsisId('Isa.67', kjv)).toBeUndefined();
    expect(parsePassageOsisId('John.3.99', kjv)).toBeUndefined();
    expect(parsePassageOsisId('Nope.1', kjv)).toBeUndefined();
  });

  it('converts parsed references and finds the containing chapter', () => {
    expect(passageFromReference({ book: 'Isa', chapter: 53, verse: undefined }, kjv)).toEqual(
      ISAIAH_53,
    );
    expect(passageFromReference({ book: 'John', chapter: 3, verse: 16 }, kjv)).toEqual(
      versePassage(JOHN_3_16),
    );
    expect(chapterPassageOf(JOHN_3_16, kjv)).toEqual({ kind: 'chapter', book: 'John', chapter: 3 });
  });

  it('compares passages', () => {
    expect(isSamePassage(versePassage(1), versePassage(1))).toBe(true);
    expect(isSamePassage(versePassage(1), versePassage(2))).toBe(false);
    expect(isSamePassage(ISAIAH_53, { kind: 'chapter', book: 'Isa', chapter: 53 })).toBe(true);
    expect(isSamePassage(ISAIAH_53, null)).toBe(false);
    expect(isSamePassage(null, null)).toBe(true);
  });
});
