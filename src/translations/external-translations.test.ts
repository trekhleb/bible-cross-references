import { describe, expect, it } from 'vitest';
import { BOOKS, type BookId } from '../core/bible/books.ts';
import { versePassage, type Passage } from '../core/bible/passage.ts';
import { parseOsisId, type VerseRef } from '../core/bible/verse-ref.ts';
import { CANONICAL_VERSIFICATION } from '../core/bible/versification.ts';
import { verseIndex } from '../test-utils/fixtures.ts';
import {
  EXTERNAL_SITE,
  EXTERNAL_TRANSLATIONS,
  externalPassageUrl,
  externalTranslationsFor,
  type ExternalTranslation,
} from './external-translations.ts';

function translation(id: ExternalTranslation['id']): ExternalTranslation {
  const found = EXTERNAL_TRANSLATIONS.find((candidate) => candidate.id === id);
  if (!found) {
    throw new Error(`No external translation ${id}`);
  }
  return found;
}

const ESV = translation('esv');
const NASB_1995 = translation('nasb1995');
const NLT = translation('nlt');

/** The sixteen verses the earliest manuscripts do not have, spelled out so the test pins them. */
const MANUSCRIPT_OMISSIONS = [
  'Matt.17.21',
  'Matt.18.11',
  'Matt.23.14',
  'Mark.7.16',
  'Mark.9.44',
  'Mark.9.46',
  'Mark.11.26',
  'Mark.15.28',
  'Luke.17.36',
  'Luke.23.17',
  'John.5.4',
  'Acts.8.37',
  'Acts.15.34',
  'Acts.24.7',
  'Acts.28.29',
  'Rom.16.24',
];

function verse(book: BookId, chapter: number, number: number): Passage {
  return versePassage(verseIndex(book, chapter, number));
}

function chapter(book: BookId, number: number): Passage {
  return { kind: 'chapter', book, chapter: number };
}

function url(target: ExternalTranslation, passage: Passage): string {
  return externalPassageUrl(target, passage, CANONICAL_VERSIFICATION);
}

/** A verse named by its OSIS ID, which is how every list in the module names one. */
function verseNamed(osisId: string): { readonly passage: Passage; readonly ref: VerseRef } {
  const ref = parseOsisId(osisId);
  const index = ref && CANONICAL_VERSIFICATION.indexOf(ref);
  if (!ref || index === undefined) {
    throw new Error(`${osisId} is not a verse of the KJV versification`);
  }
  return { passage: versePassage(index), ref };
}

describe('the translations linked to on bible.com', () => {
  it('are the ESV, the NASB 1995 and the NLT, in that order, beside an English text', () => {
    expect(externalTranslationsFor('en').map((each) => each.abbreviation)).toEqual([
      'ESV',
      'NASB 1995',
      'NLT',
    ]);
    // A region does not change the language.
    expect(externalTranslationsFor('en-GB')).toHaveLength(3);
  });

  it('are not offered beside a text in another language, which they are not in', () => {
    for (const language of ['pt-BR', 'de', 'it', 'es', 'uk']) {
      expect(externalTranslationsFor(language)).toEqual([]);
    }
  });

  it('open on bible.com, which is what the links say', () => {
    expect(EXTERNAL_SITE).toBe('bible.com');
  });
});

describe('externalPassageUrl', () => {
  it("opens a verse on its own page, under the translation's number and code", () => {
    expect(url(ESV, verse('John', 3, 16))).toBe('https://www.bible.com/bible/59/JHN.3.16.ESV');
    expect(url(NASB_1995, verse('John', 3, 16))).toBe(
      'https://www.bible.com/bible/100/JHN.3.16.NASB1995',
    );
    expect(url(NLT, verse('John', 3, 16))).toBe('https://www.bible.com/bible/116/JHN.3.16.NLT');
  });

  it('opens a chapter whole', () => {
    expect(url(ESV, chapter('Ps', 23))).toBe('https://www.bible.com/bible/59/PSA.23.ESV');
    expect(url(NLT, chapter('Gen', 1))).toBe('https://www.bible.com/bible/116/GEN.1.NLT');
  });

  /**
   * bible.com names books with USFM codes. The eBible importer's table looks the same and is
   * not: these eleven are where the two part, and where borrowing it would break the links.
   */
  it("names books with bible.com's own codes, including the eleven the eBible files spell otherwise", () => {
    const differing: readonly (readonly [BookId, string])[] = [
      ['Song', 'SNG'],
      ['Ezek', 'EZK'],
      ['Joel', 'JOL'],
      ['Nah', 'NAM'],
      ['Mark', 'MRK'],
      ['John', 'JHN'],
      ['Phil', 'PHP'],
      ['Jas', 'JAS'],
      ['1John', '1JN'],
      ['2John', '2JN'],
      ['3John', '3JN'],
    ];
    for (const [book, code] of differing) {
      expect(url(NASB_1995, chapter(book, 1))).toBe(
        `https://www.bible.com/bible/100/${code}.1.NASB1995`,
      );
    }
  });

  it('gives each of the 66 books a code of its own', () => {
    const codes = BOOKS.map((book) => {
      const path = new URL(url(NASB_1995, chapter(book.id, 1))).pathname;
      return path.split('/').at(-1)?.split('.')[0] ?? '';
    });
    expect(new Set(codes).size).toBe(66);
    for (const code of codes) {
      expect(code).toMatch(/^[1-3A-Z][A-Z]{2}$/u);
    }
  });

  it('opens the chapter for a verse the translation leaves out, where its footnote is', () => {
    expect(url(ESV, verse('Acts', 8, 37))).toBe('https://www.bible.com/bible/59/ACT.8.ESV');
    expect(url(NLT, verse('Acts', 8, 37))).toBe('https://www.bible.com/bible/116/ACT.8.NLT');
    // The NASB 1995 prints it, in brackets.
    expect(url(NASB_1995, verse('Acts', 8, 37))).toBe(
      'https://www.bible.com/bible/100/ACT.8.37.NASB1995',
    );
  });

  it('opens Matthew 12:47 whole in the NLT and the NASB 1995, and its chapter in the ESV', () => {
    expect(url(ESV, verse('Matt', 12, 47))).toBe('https://www.bible.com/bible/59/MAT.12.ESV');
    expect(url(NLT, verse('Matt', 12, 47))).toBe('https://www.bible.com/bible/116/MAT.12.47.NLT');
    expect(url(NASB_1995, verse('Matt', 12, 47))).toBe(
      'https://www.bible.com/bible/100/MAT.12.47.NASB1995',
    );
  });

  it('opens the chapter for every verse the earliest manuscripts do not have, in the ESV and the NLT', () => {
    for (const osisId of MANUSCRIPT_OMISSIONS) {
      const { passage, ref } = verseNamed(osisId);
      const whole = chapter(ref.book, ref.chapter);
      expect(url(ESV, passage)).toBe(url(ESV, whole));
      expect(url(NLT, passage)).toBe(url(NLT, whole));
      expect(url(NASB_1995, passage)).not.toBe(url(NASB_1995, whole));
    }
  });

  it('leaves out exactly what each edition leaves out on bible.com', () => {
    expect(new Set(NLT.omits)).toEqual(new Set(MANUSCRIPT_OMISSIONS));
    expect(new Set(ESV.omits)).toEqual(new Set([...MANUSCRIPT_OMISSIONS, 'Matt.12.47']));
    expect(NASB_1995.omits.size).toBe(0);
  });

  it('spans the verses a translation divides what the KJV numbers as one', () => {
    expect(url(ESV, verse('3John', 1, 14))).toBe('https://www.bible.com/bible/59/3JN.1.14-15.ESV');
    expect(url(NASB_1995, verse('Phil', 1, 16))).toBe(
      'https://www.bible.com/bible/100/PHP.1.16-17.NASB1995',
    );
    expect(url(NLT, verse('Phil', 1, 17))).toBe('https://www.bible.com/bible/116/PHP.1.16-17.NLT');
    // The NLT alone moves the end of 1 John 2:13 into its 2:14.
    expect(url(NLT, verse('1John', 2, 13))).toBe('https://www.bible.com/bible/116/1JN.2.13-14.NLT');
    expect(url(ESV, verse('1John', 2, 13))).toBe('https://www.bible.com/bible/59/1JN.2.13.ESV');
  });

  it('names only verses that exist, and spans that include the verse they stand for', () => {
    for (const each of EXTERNAL_TRANSLATIONS) {
      for (const osisId of each.omits) {
        expect(() => verseNamed(osisId)).not.toThrow();
      }
      for (const [osisId, [first, last]] of each.spans) {
        const { ref } = verseNamed(osisId);
        expect(first).toBeLessThanOrEqual(ref.verse);
        expect(last).toBeGreaterThanOrEqual(ref.verse);
        expect(first).toBeLessThan(last);
        // A verse is either left out or spanned, never both.
        expect(each.omits.has(osisId)).toBe(false);
      }
    }
  });

  /**
   * A plain address and nothing more: no query string or fragment that could carry a tracking or
   * affiliate parameter, and always the same site, over HTTPS.
   */
  it('is a bare https address on bible.com, whatever the passage', () => {
    const passages = [
      verse('Gen', 1, 1),
      verse('Acts', 8, 37),
      verse('3John', 1, 14),
      verse('Rev', 22, 21),
      chapter('Ps', 119),
    ];
    for (const each of EXTERNAL_TRANSLATIONS) {
      for (const passage of passages) {
        const address = new URL(url(each, passage));
        expect(address.origin).toBe('https://www.bible.com');
        expect(address.search).toBe('');
        expect(address.hash).toBe('');
      }
    }
  });
});
