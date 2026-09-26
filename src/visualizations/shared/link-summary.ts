import { GENRES } from '../../core/bible/genres.ts';
import { elementAt } from '../../core/lib/array.ts';
import type { CrossReferenceIndex } from '../../cross-references/cross-reference-index.ts';

/** Headline numbers about the links a visualization currently shows. */
export interface LinkSummary {
  readonly verseCount: number;
  readonly shownLinks: number;
  readonly totalLinks: number;
  /** Verses that are the source or inside the target of at least one shown link. */
  readonly connectedVerses: number;
  /** Shown links from one testament to the other. */
  readonly crossTestamentLinks: number;
}

const IS_NEW_TESTAMENT_GENRE = GENRES.map((genre) => genre.testament === 'NT');

export function summarizeLinks(
  index: CrossReferenceIndex,
  linkIds: ArrayLike<number>,
  verseGenres: Uint8Array,
): LinkSummary {
  const connected = new Uint8Array(index.verseCount);
  let connectedVerses = 0;
  let crossTestamentLinks = 0;
  const mark = (verse: number) => {
    if (connected[verse] === 0) {
      connected[verse] = 1;
      connectedVerses += 1;
    }
  };
  for (let i = 0; i < linkIds.length; i += 1) {
    const id = elementAt(linkIds, i);
    const source = elementAt(index.sources, id);
    const targetStart = elementAt(index.targetStarts, id);
    mark(source);
    for (let verse = targetStart; verse <= elementAt(index.targetEnds, id); verse += 1) {
      mark(verse);
    }
    const sourceIsNew = IS_NEW_TESTAMENT_GENRE[elementAt(verseGenres, source)];
    const targetIsNew = IS_NEW_TESTAMENT_GENRE[elementAt(verseGenres, targetStart)];
    if (sourceIsNew !== targetIsNew) {
      crossTestamentLinks += 1;
    }
  }
  return {
    verseCount: index.verseCount,
    shownLinks: linkIds.length,
    totalLinks: index.linkCount,
    connectedVerses,
    crossTestamentLinks,
  };
}
