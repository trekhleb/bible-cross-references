import { describe, expect, it } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../core/bible/versification.ts';
import { createTranslationFile, verseIndex } from '../test-utils/fixtures.ts';
import { getTranslationManifest } from './registry.ts';
import { normalizeForSearch, Translation } from './translation.ts';

const JOHN_3_16 = verseIndex('John', 3, 16);
const MATT_17_21 = verseIndex('Matt', 17, 21);

function createTranslation() {
  return new Translation(
    getTranslationManifest('bsb'),
    CANONICAL_VERSIFICATION,
    createTranslationFile(
      new Map([
        [JOHN_3_16, 'For God so loved the world…'],
        [MATT_17_21, ''],
        [0, 'In the beginning God’s Spirit…'],
      ]),
    ),
  );
}

describe('Translation', () => {
  it('returns verse texts and flags omitted verses', () => {
    const translation = createTranslation();
    expect(translation.verseCount).toBe(31102);
    expect(translation.verseText(JOHN_3_16)).toBe('For God so loved the world…');
    expect(translation.isOmitted(MATT_17_21)).toBe(true);
    expect(translation.isOmitted(JOHN_3_16)).toBe(false);
  });

  it('rejects text with the wrong number of verses', () => {
    const file = { ...createTranslationFile(), verses: ['only one verse'] };
    expect(
      () => new Translation(getTranslationManifest('bsb'), CANONICAL_VERSIFICATION, file),
    ).toThrow('has 1 verses, expected 31102');
  });

  it('searches case-insensitively, ignoring quote styles', () => {
    const translation = createTranslation();
    expect(translation.search("GOD'S", 10)).toEqual({ totalCount: 1, verses: [0] });
    expect(translation.search('god', 10).verses).toEqual([0, JOHN_3_16]);
  });

  it('limits results but reports the total', () => {
    const result = createTranslation().search('verse number', 3);
    expect(result.verses).toEqual([1, 2, 3]);
    expect(result.totalCount).toBe(31102 - 3);
  });

  it('returns nothing for a blank query', () => {
    expect(createTranslation().search('   ', 10)).toEqual({ totalCount: 0, verses: [] });
  });
});

describe('normalizeForSearch', () => {
  it('normalizes case, quotes and whitespace', () => {
    expect(normalizeForSearch('  “Lord’s”   Prayer ')).toBe('"lord\'s" prayer');
  });
});
