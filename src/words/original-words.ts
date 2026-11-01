import type { VerseIndex } from '../core/bible/verse-ref.ts';
import type { OriginalWordColumns } from '../core/datasets/formats.ts';

/** One dictionary word of the Hebrew or Greek, as shown beside a verse. */
export interface OriginalWord {
  /** Position in the dataset, which is how its verses are looked up. */
  readonly index: number;
  /** Extended Strong's number, e.g. `G4128`. */
  readonly strongs: string;
  /** Dictionary form in its own script, e.g. `πλῆθος`. */
  readonly lemma: string;
  readonly transliteration: string;
  readonly gloss: string;
  /** How many verses use the word, the whole Bible over. */
  readonly verseCount: number;
}

/**
 * Which dictionary words each verse uses, and which verses each word appears in.
 *
 * The dataset is stored the second way round, as one sorted verse list per word. A verse needs
 * the first, so the index is turned inside out once here, when the file loads.
 */
export class OriginalWordIndex {
  readonly #columns: OriginalWordColumns;
  /** CSR over verses: the words of verse `v` are at `#offsets[v]` to `#offsets[v + 1] - 1`. */
  readonly #offsets: Int32Array;
  readonly #words: Int32Array;

  constructor(columns: OriginalWordColumns, verseCount: number) {
    this.#columns = columns;
    const wordCount = columns.strongs.length;
    if (columns.offsets.length !== wordCount + 1) {
      throw new Error('Original words: there is not one offset per word, plus the end.');
    }
    const counts = new Int32Array(verseCount + 1);
    for (const verse of columns.verses) {
      // Out of range, this would land in Genesis 1:1 rather than anywhere visible, so it is
      // refused instead: a dataset that disagrees with the versification is a build problem.
      if (verse < 0 || verse >= verseCount) {
        throw new Error(`Original words: verse ${String(verse)} is outside the versification.`);
      }
      counts[verse] = (counts[verse] ?? 0) + 1;
    }
    const offsets = new Int32Array(verseCount + 1);
    let running = 0;
    for (let verse = 0; verse < verseCount; verse += 1) {
      offsets[verse] = running;
      running += counts[verse] ?? 0;
    }
    offsets[verseCount] = running;
    const words = new Int32Array(running);
    const cursor = Int32Array.from(offsets.subarray(0, verseCount));
    for (let word = 0; word < wordCount; word += 1) {
      const start = columns.offsets[word] ?? 0;
      const end = columns.offsets[word + 1] ?? start;
      for (let at = start; at < end; at += 1) {
        const verse = columns.verses[at] ?? 0;
        const slot = cursor[verse] ?? 0;
        words[slot] = word;
        cursor[verse] = slot + 1;
      }
    }
    this.#offsets = offsets;
    this.#words = words;
  }

  /** How many pairs of a word and a verse the dataset holds. */
  get verseEntries(): number {
    return this.#columns.verses.length;
  }

  /** How many words the dataset covers. */
  get wordCount(): number {
    return this.#columns.strongs.length;
  }

  #wordAt(index: number): OriginalWord {
    const { strongs, lemma, transliteration, gloss, offsets } = this.#columns;
    return {
      index,
      strongs: strongs[index] ?? '',
      lemma: lemma[index] ?? '',
      transliteration: transliteration[index] ?? '',
      gloss: gloss[index] ?? '',
      verseCount: (offsets[index + 1] ?? 0) - (offsets[index] ?? 0),
    };
  }

  /**
   * The words of a verse, the least common first: a word used in a handful of places says
   * something about where it is used, and one used everywhere says nothing.
   */
  wordsOf(verse: VerseIndex): readonly OriginalWord[] {
    const start = this.#offsets[verse] ?? 0;
    const end = this.#offsets[verse + 1] ?? start;
    const words: OriginalWord[] = [];
    for (let at = start; at < end; at += 1) {
      words.push(this.#wordAt(this.#words[at] ?? 0));
    }
    return words.sort((a, b) => a.verseCount - b.verseCount || a.strongs.localeCompare(b.strongs));
  }

  /**
   * Where the pair of a word and one of its verses sits in the dataset's `verses` column, which
   * is also where the word's use in that verse is described in the occurrences dataset. `null`
   * when the word is not in that verse.
   */
  entryOf(word: number, verse: VerseIndex): number | null {
    const { offsets, verses } = this.#columns;
    let low = offsets[word] ?? 0;
    let high = (offsets[word + 1] ?? low) - 1;
    // A word's verses are stored in canonical order, so the pair is found by halving.
    while (low <= high) {
      const middle = (low + high) >>> 1;
      const found = verses[middle] ?? 0;
      if (found === verse) {
        return middle;
      }
      if (found < verse) {
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    return null;
  }

  /** Every verse that uses a word, in canonical order. */
  versesOf(word: number): readonly VerseIndex[] {
    const { offsets, verses } = this.#columns;
    const start = offsets[word] ?? 0;
    const end = offsets[word + 1] ?? start;
    const found: VerseIndex[] = [];
    for (let at = start; at < end; at += 1) {
      const verse = verses[at];
      if (verse !== undefined) {
        found.push(verse);
      }
    }
    return found;
  }
}
