import type { VerseIndex } from '../core/bible/verse-ref.ts';
import type { Versification } from '../core/bible/versification.ts';
import type {
  DatasetProvenance,
  ImportNotice,
  TranslationTextFile,
} from '../core/datasets/formats.ts';
import { elementAt } from '../core/lib/array.ts';
import type { TranslationManifest } from './translation-manifest.ts';

export interface TextSearchResult {
  /** Total number of matching verses. */
  readonly totalCount: number;
  /** Matching verses in canonical order, at most `limit` of them. */
  readonly verses: readonly VerseIndex[];
}

/** Normalizes text for case- and quote-style-insensitive matching (`God’s` matches `god's`). */
export function normalizeForSearch(text: string): string {
  return text.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
}

/** A bundled translation's full text, addressed by verse index. */
export class Translation {
  readonly manifest: TranslationManifest;
  readonly versification: Versification;
  readonly provenance: DatasetProvenance;
  readonly notices: readonly ImportNotice[];

  readonly #verses: readonly string[];
  #searchableVerses: readonly string[] | undefined;

  /** `file` must be validated against the manifest (see `parseTranslationTextFile`). */
  constructor(
    manifest: TranslationManifest,
    versification: Versification,
    file: TranslationTextFile,
  ) {
    if (file.verses.length !== versification.verseCount) {
      throw new Error(
        `Translation "${manifest.id}" has ${file.verses.length} verses, ` +
          `expected ${versification.verseCount}.`,
      );
    }
    this.manifest = manifest;
    this.versification = versification;
    this.provenance = file.provenance;
    this.notices = file.notices;
    this.#verses = file.verses;
  }

  get verseCount(): number {
    return this.#verses.length;
  }

  /** Text of the verse, or an empty string if the translation omits it. */
  verseText(index: VerseIndex): string {
    return elementAt(this.#verses, index);
  }

  isOmitted(index: VerseIndex): boolean {
    return this.verseText(index) === '';
  }

  /** Finds verses containing `query` (case-insensitive, ignoring quote styles). */
  search(query: string, limit: number): TextSearchResult {
    const needle = normalizeForSearch(query);
    if (needle === '') {
      return { totalCount: 0, verses: [] };
    }
    this.#searchableVerses ??= this.#verses.map(normalizeForSearch);

    const verses: VerseIndex[] = [];
    let totalCount = 0;
    this.#searchableVerses.forEach((text, index) => {
      if (text.includes(needle)) {
        totalCount += 1;
        if (verses.length < limit) {
          verses.push(index);
        }
      }
    });
    return { totalCount, verses };
  }
}
