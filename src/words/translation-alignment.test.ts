import { describe, expect, it } from 'vitest';
import type { OriginalWordColumns } from '../core/datasets/formats.ts';
import { OriginalWordIndex } from './original-words.ts';
import { alignerFor, TranslationAligner } from './translation-alignment.ts';

/**
 * Four verses of a made-up translation. "love" (G0025) is in verses 0–2 and "neighbour" (G4139) in
 * 0 and 1, always beside it — the case that needs each word of the text to go to one word only.
 */
const TEXT = [
  'Będziesz miłował swego bliźniego.',
  'I miłował bliźniego swego.',
  // `swego` is common, as it is in the real text, so it cannot pass for `bliźniego`.
  'Bóg miłował swego syna.',
  'Na początku było Słowo.',
];

function index(): OriginalWordIndex {
  const columns: OriginalWordColumns = {
    strongs: ['G0025', 'G4139', 'G9999'],
    lemma: ['ἀγαπάω', 'πλησίον', 'λόγος'],
    transliteration: ['agapaō', 'plēsion', 'logos'],
    gloss: ['to love', 'neighbour', 'word'],
    offsets: [0, 3, 5, 6],
    verses: [0, 1, 2, 0, 1, 3],
  };
  return new OriginalWordIndex(columns, TEXT.length);
}

function aligner() {
  return new TranslationAligner(index(), (verse) => TEXT[verse] ?? '', TEXT.length);
}

describe('TranslationAligner', () => {
  it('finds the word of the text each original word is rendered by', () => {
    const aligned = aligner().align(0);
    expect(aligned.get(0)?.text).toBe('miłował');
    expect(aligned.get(1)?.text).toBe('bliźniego');
  });

  it('gives each word of the text to one original word, so neighbours do not take "love"', () => {
    const aligned = aligner().align(1);
    expect(aligned.get(1)?.text).toBe('bliźniego');
    expect(aligned.get(0)?.text).toBe('miłował');
  });

  it('says where in the verse the word is, so it can be marked', () => {
    const span = aligner().align(2).get(0);
    expect(span && TEXT[2]?.slice(span.start, span.end)).toBe('miłował');
  });

  it('marks nothing it cannot pair with confidence', () => {
    const words = new OriginalWordIndex(
      {
        strongs: ['G0001'],
        lemma: ['x'],
        transliteration: ['x'],
        gloss: ['x'],
        offsets: [0, 1],
        verses: [3],
      },
      TEXT.length,
    );
    const lonely = new TranslationAligner(words, () => '', TEXT.length);
    expect(lonely.align(3).size).toBe(0);
  });

  it('answers a verse it has aligned before from memory', () => {
    const shared = aligner();
    expect(shared.align(0)).toBe(shared.align(0));
  });

  it('keeps one aligner per translation and index', () => {
    const translation = { verseText: (verse: number) => TEXT[verse] ?? '' };
    const words = index();
    expect(alignerFor(translation, words, TEXT.length)).toBe(
      alignerFor(translation, words, TEXT.length),
    );
    expect(alignerFor(translation, index(), TEXT.length)).not.toBe(
      alignerFor(translation, words, TEXT.length),
    );
  });
});
