import { describe, expect, it } from 'vitest';
import { BOOKS } from '../../../src/core/bible/books.ts';
import { KJV_CHAPTER_VERSE_COUNTS } from '../../../src/core/bible/kjv-versification.ts';
import { PROVENANCE, verseIndex } from '../../../src/test-utils/fixtures.ts';
import { importEsvText } from './esv.ts';

const OMITTED = new Set(['Matt 17:21', 'Rom 16:24']);

function line(bookNumber: number, chapter: number, verse: number, text: string): string {
  const code = `${String(bookNumber).padStart(2, '0')}${String(chapter).padStart(3, '0')}${String(verse).padStart(3, '0')}`;
  return `${code}\tXx\t${chapter}:${verse}\t${text}`;
}

/**
 * Builds a complete ESV-style file: a heading line (verse 0) per chapter, every KJV verse except
 * a few the ESV omits, and 3 John 1:15. `transform` may rewrite or drop (return `null`) lines.
 */
function createEsvText(transform: (line: string) => string | null = (text) => text): string {
  const lines = BOOKS.flatMap((book, bookOffset) =>
    KJV_CHAPTER_VERSE_COUNTS[book.id].flatMap((verseCount, chapterOffset) => {
      const chapter = chapterOffset + 1;
      const lastVerse = book.id === '3John' ? verseCount + 1 : verseCount;
      return [
        line(bookOffset + 1, chapter, 0, `Chapter ${chapter}`),
        ...Array.from({ length: lastVerse }, (_, verseOffset) => {
          const reference = `${book.id} ${chapter}:${verseOffset + 1}`;
          return OMITTED.has(reference)
            ? null
            : line(bookOffset + 1, chapter, verseOffset + 1, `Text of ${reference}.`);
        }),
      ];
    }),
  )
    .filter((text) => text !== null)
    .map(transform)
    .filter((text) => text !== null);
  return [...lines, ''].join('\r\n');
}

describe('importEsvText', () => {
  it('imports every verse in canonical order, skipping chapter headings', () => {
    const file = importEsvText(createEsvText(), PROVENANCE);
    expect(file).toMatchObject({
      format: 'translation-text',
      translationId: 'esv',
      versification: 'kjv',
      provenance: PROVENANCE,
    });
    expect(file.verses).toHaveLength(31102);
    expect(file.verses[0]).toBe('Text of Gen 1:1.');
    expect(file.verses[verseIndex('Ps', 23, 1)]).toBe('Text of Ps 23:1.');
    expect(file.verses.at(-1)).toBe('Text of Rev 22:21.');
  });

  it('keeps omitted verses as empty text and reports them', () => {
    const file = importEsvText(createEsvText(), PROVENANCE);
    expect(file.verses[verseIndex('Matt', 17, 21)]).toBe('');
    expect(file.notices).toContainEqual(
      expect.objectContaining({ count: 2, examples: ['Matt.17.21', 'Rom.16.24'] }),
    );
  });

  it('appends 3 John 1:15 to 1:14, as the KJV numbers it', () => {
    const file = importEsvText(createEsvText(), PROVENANCE);
    expect(file.verses[verseIndex('3John', 1, 14)]).toBe('Text of 3John 1:14. Text of 3John 1:15.');
    expect(file.notices).toContainEqual(expect.objectContaining({ examples: ['3John.1.15'] }));
  });

  it('collapses whitespace and straightens stray curly quotes', () => {
    const file = importEsvText(
      createEsvText((text) =>
        text.startsWith('01001001\t') ? '01001001\tGn\t1:1\tA title.  “In the beginning." ' : text,
      ),
      PROVENANCE,
    );
    expect(file.verses[0]).toBe('A title. "In the beginning."');
    expect(file.notices).toContainEqual(expect.objectContaining({ examples: ['Gen.1.1'] }));
  });

  it.each([
    [
      'an unknown book',
      (text: string) => text.replace(/^01001001\tXx/m, '67001001\tXx'),
      'unknown book number 67',
    ],
    [
      'a code that disagrees with its chapter and verse',
      (text: string) => text.replace(/^01001001\tXx\t1:1/m, '01001001\tXx\t1:2'),
      'code Gen.1.1 does not match "1:2"',
    ],
    [
      'a verse outside the versification',
      (text: string) => text.replace(/^01001001\tXx\t1:1/m, '01001099\tXx\t1:99'),
      'Gen.1.99 is not in the KJV versification',
    ],
    [
      'a duplicate verse',
      (text: string) => text.replace(/^01001002\tXx\t1:2/m, '01001001\tXx\t1:1'),
      'duplicate verse Gen.1.1',
    ],
    [
      'a malformed line',
      (text: string) => text.replace(/^01001001\tXx\t/m, '01001001 Xx '),
      'unrecognized format',
    ],
  ])('rejects %s', (_, corrupt, message) => {
    expect(() => importEsvText(corrupt(createEsvText()), PROVENANCE)).toThrow(message);
  });

  it('rejects missing verses other than the ones the ESV omits', () => {
    const text = createEsvText((text) => (text.startsWith('65001') ? null : text));
    expect(() => importEsvText(text, PROVENANCE)).toThrow('25 verses are missing, e.g. Jude.1.1');
  });
});
