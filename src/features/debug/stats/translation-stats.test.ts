import { describe, expect, it } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../../core/bible/versification.ts';
import { createTranslationFile, verseIndex } from '../../../test-utils/fixtures.ts';
import { getTranslationManifest } from '../../../translations/registry.ts';
import { Translation } from '../../../translations/translation.ts';
import { computeTranslationStats, countWords } from './translation-stats.ts';

describe('countWords', () => {
  it('counts tokens containing letters or digits', () => {
    expect(countWords('Jesus wept.')).toBe(2);
    expect(countWords('“Come,” — He said, “and see.”')).toBe(5);
    expect(countWords('')).toBe(0);
  });
});

describe('computeTranslationStats', () => {
  it('summarizes the text', () => {
    const omitted = verseIndex('Matt', 17, 21);
    const shortest = verseIndex('John', 11, 35);
    const translation = new Translation(
      getTranslationManifest('bsb'),
      CANONICAL_VERSIFICATION,
      createTranslationFile(
        new Map([
          [0, 'one two three four five six seven eight nine ten'],
          [shortest, 'Jesus wept.'],
          [omitted, ''],
        ]),
      ),
    );
    const stats = computeTranslationStats(translation);

    // Every other verse reads "Verse number <n>." (3 words).
    const regularVerseCount = 31102 - 3;
    expect(stats).toMatchObject({
      verseCount: 31102,
      textVerseCount: 31101,
      omittedVerses: [omitted],
      bookCount: 66,
      chapterCount: 1189,
      wordCount: regularVerseCount * 3 + 10 + 2,
      longestVerse: { verse: 0, value: 10 },
      shortestVerse: { verse: shortest, value: 2 },
    });
  });
});
