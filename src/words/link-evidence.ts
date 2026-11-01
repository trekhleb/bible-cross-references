import type { VerseIndex } from '../core/bible/verse-ref.ts';
import type { OriginalWord, OriginalWordIndex } from './original-words.ts';

/** A word of one passage set beside the word of the other that means the same. */
export interface MeaningPair {
  readonly here: OriginalWord;
  readonly there: OriginalWord;
}

/**
 * What the two ends of a cross-reference have in common in the original languages, strongest
 * first:
 *
 * - `shared-word`: the same dictionary word stands in both. That is a fact about the texts, and
 *   the rarer the word, the more it says — so the words come least common first.
 * - `same-meaning`: no word is shared, but a word of each is glossed alike, e.g. Hebrew שָׁלוֹם and
 *   Greek εἰρήνη, both "peace". The only kind of evidence a link between the Testaments can have,
 *   since they are in different languages, and an approximation, since glosses are short.
 * - `thematic`: neither. The link stands on the judgement of the Treasury of Scripture
 *   Knowledge's editors, and saying so is the honest answer.
 *
 * Only the words of the words dataset are compared, so the commonest words (those in more than
 * `maxVerses` verses) never count as evidence: two verses sharing "and" or "God" share nothing.
 */
export type LinkEvidence =
  | { readonly kind: 'shared-word'; readonly words: readonly OriginalWord[] }
  | { readonly kind: 'same-meaning'; readonly pairs: readonly MeaningPair[] }
  | { readonly kind: 'thematic' };

/**
 * The part of a gloss that says what a word means, comparable between the two languages: the
 * first sense, without the infinitive's "to", a "be", or a bracketed note. `to love` and `love`
 * meet; `peace / friendship` is compared as `peace`.
 */
export function meaningKey(gloss: string): string {
  return (gloss.split(' / ')[0] ?? '')
    .toLowerCase()
    .replaceAll(/\([^)]*\)|\[[^\]]*\]/g, '')
    .replace(/^(to be|to|be)\s+/, '')
    .trim();
}

/**
 * Every meaning a gloss offers for comparison: a first sense written as alternatives —
 * `near/neighbor` — offers each, so Greek πλησίον meets Hebrew רֵעַ, glossed `neighbor`.
 */
export function meaningKeys(gloss: string): readonly string[] {
  const whole = meaningKey(gloss);
  const parts = whole.split('/').map((part) => meaningKey(part));
  return [...new Set([whole, ...parts])].filter((key) => key !== '');
}

function wordsOfRange(index: OriginalWordIndex, start: VerseIndex, end: VerseIndex) {
  const words = new Map<number, OriginalWord>();
  for (let verse = start; verse <= end; verse += 1) {
    for (const word of index.wordsOf(verse)) {
      words.set(word.index, word);
    }
  }
  return words;
}

export function linkEvidence(
  index: OriginalWordIndex,
  here: VerseIndex,
  otherStart: VerseIndex,
  otherEnd: VerseIndex,
): LinkEvidence {
  const ours = index.wordsOf(here);
  const theirs = wordsOfRange(index, otherStart, otherEnd);
  // `wordsOf` already lists the rarest first, so the order carries over.
  const shared = ours.filter((word) => theirs.has(word.index));
  if (shared.length > 0) {
    return { kind: 'shared-word', words: shared };
  }
  const byMeaning = new Map<string, OriginalWord>();
  for (const word of [...theirs.values()].sort((a, b) => a.verseCount - b.verseCount)) {
    for (const key of meaningKeys(word.gloss)) {
      if (!byMeaning.has(key)) {
        byMeaning.set(key, word);
      }
    }
  }
  const pairs: MeaningPair[] = [];
  for (const word of ours) {
    const there = meaningKeys(word.gloss)
      .map((key) => byMeaning.get(key))
      .find((found) => found !== undefined);
    if (there) {
      pairs.push({ here: word, there });
    }
  }
  return pairs.length > 0 ? { kind: 'same-meaning', pairs } : { kind: 'thematic' };
}
