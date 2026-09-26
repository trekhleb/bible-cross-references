import { describe, expect, it } from 'vitest';
import { BOOKS, getReferenceName } from '../../../src/core/bible/books.ts';
import { KJV_CHAPTER_VERSE_COUNTS } from '../../../src/core/bible/kjv-versification.ts';
import { PROVENANCE, verseIndex } from '../../../src/test-utils/fixtures.ts';
import { importBsbText } from './bsb.ts';

const PREAMBLE =
  'The Holy Bible, Berean Standard Bible\t\nThis text has been dedicated to the public domain.\t';
const HEADER = 'Verse\tBerean Standard Bible';

/** Builds a complete BSB-style file; `transform` may rewrite or drop (return `null`) lines. */
function createBsbText(transform: (line: string) => string | null = (line) => line): string {
  const lines = BOOKS.flatMap((book) =>
    KJV_CHAPTER_VERSE_COUNTS[book.id].flatMap((verseCount, chapterOffset) =>
      Array.from({ length: verseCount }, (_, verseOffset) => {
        const reference = `${getReferenceName(book)} ${chapterOffset + 1}:${verseOffset + 1}`;
        return transform(`${reference}\tText of ${reference}.`);
      }),
    ),
  ).filter((line) => line !== null);
  return ['﻿' + PREAMBLE, HEADER, ...lines, ''].join('\r\n');
}

describe('importBsbText', () => {
  it('imports every verse in canonical order', () => {
    const file = importBsbText(createBsbText(), PROVENANCE);
    expect(file).toMatchObject({
      format: 'translation-text',
      translationId: 'bsb',
      versification: 'kjv',
      provenance: PROVENANCE,
      notices: [],
    });
    expect(file.verses).toHaveLength(31102);
    expect(file.verses[0]).toBe('Text of Genesis 1:1.');
    expect(file.verses[verseIndex('Ps', 23, 1)]).toBe('Text of Psalm 23:1.');
    expect(file.verses.at(-1)).toBe('Text of Revelation 22:21.');
  });

  it('keeps omitted verses as empty text and reports them', () => {
    const file = importBsbText(
      createBsbText((line) => (line.startsWith('Matthew 17:21\t') ? 'Matthew 17:21\t' : line)),
      PROVENANCE,
    );
    expect(file.verses[verseIndex('Matt', 17, 21)]).toBe('');
    expect(file.notices).toEqual([
      expect.objectContaining({ level: 'info', count: 1, examples: ['Matt.17.21'] }),
    ]);
  });

  it.each([
    [
      'a missing header',
      (text: string) => text.replace(HEADER, 'Reference\tText'),
      'column header',
    ],
    [
      'an unknown book',
      (text: string) => text.replace('Genesis 1:1\t', 'Genesys 1:1\t'),
      'unknown book "Genesys"',
    ],
    [
      'a verse outside the versification',
      (text: string) => text.replace('Genesis 1:1\t', 'Genesis 1:99\t'),
      'Gen.1.99 is not in the KJV versification',
    ],
    [
      'a duplicate verse',
      (text: string) => text.replace('Genesis 1:2\t', 'Genesis 1:1\t'),
      'duplicate verse Gen.1.1',
    ],
    [
      'a malformed line',
      (text: string) => text.replace('Genesis 1:1\t', 'Genesis 1-1\t'),
      'unrecognized format',
    ],
  ])('rejects %s', (_, corrupt, message) => {
    expect(() => importBsbText(corrupt(createBsbText()), PROVENANCE)).toThrow(message);
  });

  it('rejects incomplete text', () => {
    const text = createBsbText((line) => (line.startsWith('Jude 1:') ? null : line));
    expect(() => importBsbText(text, PROVENANCE)).toThrow('25 verses are missing, e.g. Jude.1.1');
  });
});
