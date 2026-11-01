import type { VerseIndex } from '../core/bible/verse-ref.ts';
import type { OriginalWordIndex } from './original-words.ts';

/** Where a word of a translation sits in its verse's text. */
export interface AlignedSpan {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/**
 * Which word of a translation renders which word of the Hebrew or Greek, in a given verse.
 *
 * No translation the app ships is tagged word by word, so the pairing is learned from the texts
 * themselves, the way aligners of parallel texts have long done it: a Hebrew word in 184 verses
 * and a Polish word found in most of those and in few others belong together. The strength of a
 * pairing is the Dice coefficient of the two sets of verses, `2·both / (one + other)`.
 *
 * Within a verse each word of the translation is given to one original word at most, strongest
 * pairing first. Without that, "neighbour" — which nearly always stands beside "love" in the
 * commandment — would take the word for "love" as its own.
 *
 * An approximation, and shown as one: a pairing weaker than `MIN_STRENGTH` is no pairing, and the
 * word is simply not marked.
 */

/** Below this, a pairing is noise: a word that merely shares a few verses with another. */
const MIN_STRENGTH = 0.08;

/**
 * Words are compared by their first letters, so the forms of one word meet: Polish `miłował`,
 * `miłować`, `miłowali`. Six is short enough for most inflections and long enough to keep
 * different words apart.
 */
const STEM_LENGTH = 6;

/** Verses aligned so far are kept, up to this many; a panel needs a few dozen. */
const MAX_CACHED_VERSES = 2000;

const WORD = /\p{L}+/gu;

interface Token {
  readonly stem: string;
  readonly start: number;
  readonly end: number;
}

function tokenize(text: string): Token[] {
  return [...text.matchAll(WORD)].map((match) => ({
    stem: match[0].toLowerCase().slice(0, STEM_LENGTH),
    start: match.index,
    end: match.index + match[0].length,
  }));
}

export class TranslationAligner {
  readonly #index: OriginalWordIndex;
  readonly #textOf: (verse: VerseIndex) => string;
  readonly #verseCount: number;
  #tokens: Token[][] | null = null;
  /** In how many verses each stem appears. */
  #verseFrequency: Map<string, number> | null = null;
  /** Per original word: in how many of its verses each stem appears. */
  readonly #cooccurrence = new Map<number, Map<string, number>>();
  readonly #aligned = new Map<VerseIndex, ReadonlyMap<number, AlignedSpan>>();

  constructor(index: OriginalWordIndex, textOf: (verse: VerseIndex) => string, verseCount: number) {
    this.#index = index;
    this.#textOf = textOf;
    this.#verseCount = verseCount;
  }

  /** Read once, the first time anything is aligned: every verse's words, and how common each is. */
  #corpus(): { tokens: Token[][]; frequency: Map<string, number> } {
    if (!this.#tokens || !this.#verseFrequency) {
      const tokens: Token[][] = [];
      const frequency = new Map<string, number>();
      for (let verse = 0; verse < this.#verseCount; verse += 1) {
        const found = tokenize(this.#textOf(verse));
        tokens.push(found);
        for (const stem of new Set(found.map((token) => token.stem))) {
          frequency.set(stem, (frequency.get(stem) ?? 0) + 1);
        }
      }
      this.#tokens = tokens;
      this.#verseFrequency = frequency;
    }
    return { tokens: this.#tokens, frequency: this.#verseFrequency };
  }

  #cooccurrenceOf(word: number, tokens: readonly Token[][]): Map<string, number> {
    let counts = this.#cooccurrence.get(word);
    if (!counts) {
      counts = new Map();
      for (const verse of this.#index.versesOf(word)) {
        for (const stem of new Set((tokens[verse] ?? []).map((token) => token.stem))) {
          counts.set(stem, (counts.get(stem) ?? 0) + 1);
        }
      }
      this.#cooccurrence.set(word, counts);
    }
    return counts;
  }

  /** The words of a verse's text, by the original word each renders. */
  align(verse: VerseIndex): ReadonlyMap<number, AlignedSpan> {
    const cached = this.#aligned.get(verse);
    if (cached) {
      return cached;
    }
    const { tokens, frequency } = this.#corpus();
    const inVerse = tokens[verse] ?? [];
    const text = this.#textOf(verse);
    const pairs: { strength: number; word: number; token: number }[] = [];
    for (const word of this.#index.wordsOf(verse)) {
      const counts = this.#cooccurrenceOf(word.index, tokens);
      inVerse.forEach((token, at) => {
        const both = counts.get(token.stem) ?? 0;
        const strength = (2 * both) / (word.verseCount + (frequency.get(token.stem) ?? 0));
        if (strength >= MIN_STRENGTH) {
          pairs.push({ strength, word: word.index, token: at });
        }
      });
    }
    pairs.sort((a, b) => b.strength - a.strength);
    const aligned = new Map<number, AlignedSpan>();
    const taken = new Set<number>();
    for (const { word, token } of pairs) {
      const found = inVerse[token];
      if (aligned.has(word) || taken.has(token) || !found) {
        continue;
      }
      taken.add(token);
      aligned.set(word, {
        start: found.start,
        end: found.end,
        text: text.slice(found.start, found.end),
      });
    }
    if (this.#aligned.size >= MAX_CACHED_VERSES) {
      this.#aligned.clear();
    }
    this.#aligned.set(verse, aligned);
    return aligned;
  }
}

const aligners = new WeakMap<object, WeakMap<OriginalWordIndex, TranslationAligner>>();

/** One aligner per translation and word index, built the first time it is asked for. */
export function alignerFor(
  translation: { readonly verseText: (verse: VerseIndex) => string },
  index: OriginalWordIndex,
  verseCount: number,
): TranslationAligner {
  let byIndex = aligners.get(translation);
  if (!byIndex) {
    byIndex = new WeakMap();
    aligners.set(translation, byIndex);
  }
  let aligner = byIndex.get(index);
  if (!aligner) {
    aligner = new TranslationAligner(index, (verse) => translation.verseText(verse), verseCount);
    byIndex.set(index, aligner);
  }
  return aligner;
}
