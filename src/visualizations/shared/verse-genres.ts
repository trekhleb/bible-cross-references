import { getBookGenre } from '../../core/bible/genres.ts';
import type { Versification } from '../../core/bible/versification.ts';

/** Genre ordinal of every verse, indexed by verse index (for fast per-link lookups). */
export function computeVerseGenres(versification: Versification): Uint8Array {
  const genres = new Uint8Array(versification.verseCount);
  for (let verse = 0; verse < versification.verseCount; verse += 1) {
    genres[verse] = getBookGenre(versification.bookAt(verse).id).ordinal;
  }
  return genres;
}
