import { describe, expect, it } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../core/bible/versification.ts';
import { CrossReferenceIndex } from '../../cross-references/cross-reference-index.ts';
import { createCrossReferenceColumns, verseIndex } from '../../test-utils/fixtures.ts';
import { computeVerseGenres } from '../shared/verse-genres.ts';
import { voteWeight } from '../shared/vote-weight.ts';
import { buildArcInstances } from './arc-instances.ts';

describe('voteWeight', () => {
  it('grows with votes, bounded to [0.2, 1]', () => {
    expect(voteWeight(-5)).toBe(0.2);
    expect(voteWeight(0)).toBe(0.2);
    expect(voteWeight(9)).toBeCloseTo(0.6);
    expect(voteWeight(1000)).toBe(1);
  });
});

describe('buildArcInstances', () => {
  it('places endpoints at verse centers and range centers', () => {
    const gen = verseIndex('Gen', 1, 1);
    const johnStart = verseIndex('John', 1, 1);
    const index = new CrossReferenceIndex(
      createCrossReferenceColumns([{ from: gen, to: johnStart, toEnd: johnStart + 2, votes: 9 }]),
      CANONICAL_VERSIFICATION.verseCount,
    );
    const instances = buildArcInstances(index, [0], computeVerseGenres(CANONICAL_VERSIFICATION));
    expect(instances.count).toBe(1);
    expect(Array.from(instances.endpoints)).toEqual([gen + 0.5, johnStart + 1.5]);
    expect(Array.from(instances.genres)).toEqual([0, 5]); // Law → Gospels
    expect(instances.weights[0]).toBeCloseTo(0.6);
  });
});
