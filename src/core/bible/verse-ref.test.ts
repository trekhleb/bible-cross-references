import { describe, expect, it } from 'vitest';
import { parseOsisId, toOsisId } from './verse-ref.ts';

describe('OSIS IDs', () => {
  it('formats and parses verse IDs', () => {
    expect(toOsisId({ book: '1John', chapter: 4, verse: 8 })).toBe('1John.4.8');
    expect(parseOsisId('1John.4.8')).toEqual({ book: '1John', chapter: 4, verse: 8 });
  });

  it('rejects malformed IDs and unknown books', () => {
    expect(parseOsisId('John 3:16')).toBeUndefined();
    expect(parseOsisId('Jhn.3.16')).toBeUndefined();
    expect(parseOsisId('John.3')).toBeUndefined();
  });
});
