import { elementAt } from '../../core/lib/array.ts';
import type { CrossReferenceIndex } from '../../cross-references/cross-reference-index.ts';
import { voteWeight } from '../shared/vote-weight.ts';

/** Per-arc GPU attributes, one entry per link. */
export interface ArcInstances {
  readonly count: number;
  /** Source and target positions on the axis, in continuous verse units (centers). */
  readonly endpoints: Float32Array;
  /** Genre ordinals of the source and the target. */
  readonly genres: Float32Array;
  /** Brightness in [0.2, 1], growing with community votes. */
  readonly weights: Float32Array;
}

export function buildArcInstances(
  index: CrossReferenceIndex,
  linkIds: ArrayLike<number>,
  verseGenres: Uint8Array,
): ArcInstances {
  const count = linkIds.length;
  const endpoints = new Float32Array(count * 2);
  const genres = new Float32Array(count * 2);
  const weights = new Float32Array(count);
  for (let i = 0; i < count; i += 1) {
    const id = elementAt(linkIds, i);
    const source = elementAt(index.sources, id);
    const targetStart = elementAt(index.targetStarts, id);
    const targetEnd = elementAt(index.targetEnds, id);
    endpoints[i * 2] = source + 0.5;
    endpoints[i * 2 + 1] = (targetStart + targetEnd + 1) / 2;
    genres[i * 2] = elementAt(verseGenres, source);
    genres[i * 2 + 1] = elementAt(verseGenres, targetStart);
    weights[i] = voteWeight(elementAt(index.votes, id));
  }
  return { count, endpoints, genres, weights };
}
