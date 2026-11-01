import { CANONICAL_VERSIFICATION } from '../core/bible/versification.ts';
import { parseWordOccurrencesFile, type WordOccurrenceColumns } from '../core/datasets/formats.ts';
import { wordOccurrencesDatasetPath } from '../core/datasets/paths.ts';
import { loadDataset } from '../shared/lib/fetch-dataset.ts';
import type { WordSourceManifest } from './word-source-manifest.ts';

/** How one word is used in one verse. */
export interface WordUse {
  /** Tyndale's grammar code, e.g. `V-AAI-3S`; empty where the tagging could not be lined up. */
  readonly grammar: string;
  /** The English the tagging gives the word there, e.g. `he created`. */
  readonly english: string;
}

export class WordOccurrences {
  readonly #columns: WordOccurrenceColumns;

  constructor(columns: WordOccurrenceColumns) {
    this.#columns = columns;
  }

  /** The use at an entry of the words dataset (see `OriginalWordIndex.entryOf`). */
  useAt(entry: number): WordUse {
    const { grammar, grammarAt, english } = this.#columns;
    return {
      grammar: grammar[grammarAt[entry] ?? -1] ?? '',
      english: english[entry] ?? '',
    };
  }
}

/**
 * Loads the occurrences belonging to a words dataset of `verseEntries` entries, and refuses a file
 * built from a different one: lined up against the wrong words, every grammar would be another
 * word's.
 */
export async function loadWordOccurrences(
  manifest: WordSourceManifest,
  verseEntries: number,
): Promise<WordOccurrences> {
  const { value } = await loadDataset(wordOccurrencesDatasetPath(manifest.id), (json) =>
    parseWordOccurrencesFile(json, {
      id: manifest.id,
      versification: CANONICAL_VERSIFICATION.id,
    }),
  );
  if (value.verseEntries !== verseEntries) {
    throw new Error('Word occurrences: built from a different words dataset.');
  }
  return new WordOccurrences(value.occurrences);
}
