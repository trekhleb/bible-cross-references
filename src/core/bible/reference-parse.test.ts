import { describe, expect, it } from 'vitest';
import { parseReference } from './reference-parse.ts';
import { KJV_VERSIFICATION } from './versification.ts';

const parse = (input: string) => parseReference(input, KJV_VERSIFICATION);

describe('parseReference', () => {
  it.each([
    ['John 3:16', { book: 'John', chapter: 3, verse: 16 }],
    ['jn 3 16', { book: 'John', chapter: 3, verse: 16 }],
    ['john3:16', { book: 'John', chapter: 3, verse: 16 }],
    ['1 Cor 13:4', { book: '1Cor', chapter: 13, verse: 4 }],
    ['1co13.4', { book: '1Cor', chapter: 13, verse: 4 }],
    ['Gen.1.1', { book: 'Gen', chapter: 1, verse: 1 }],
    ['Song of Solomon 2:1', { book: 'Song', chapter: 2, verse: 1 }],
    ['  II Kings 2 : 11 ', { book: '2Kgs', chapter: 2, verse: 11 }],
    ['Ps 23', { book: 'Ps', chapter: 23, verse: undefined }],
  ])('parses %j', (input, reference) => {
    expect(parse(input)).toEqual({ ok: true, reference });
  });

  it.each([
    ['', 'Enter a reference like "John 3:16" or "Ps 23".'],
    ['John 3:16-18', 'Enter a reference like "John 3:16" or "Ps 23".'],
    ['Hezekiah 1:1', 'Unknown book "Hezekiah".'],
    ['Jo 1:1', '"Jo" could be Joshua, Job, Joel, Jonah or John.'],
    ['Genesis 51:1', 'Genesis has 50 chapters.'],
    ['Psalms 23:7', 'Psalm 23 has 6 verses.'],
    ['John 3:0', 'John 3 has 36 verses.'],
  ])('rejects %j', (input, error) => {
    expect(parse(input)).toEqual({ ok: false, error });
  });
});
