import { describe, expect, it } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../../core/bible/versification.ts';
import { CrossReferenceIndex } from '../../../cross-references/cross-reference-index.ts';
import { createCrossReferenceColumns, verseIndex } from '../../../test-utils/fixtures.ts';
import { computeCrossReferenceStats } from './cross-reference-stats.ts';
import { topPositions } from './top-k.ts';

const GEN_1_1 = verseIndex('Gen', 1, 1);
const GEN_1_3 = verseIndex('Gen', 1, 3);
const JOHN_1_1 = verseIndex('John', 1, 1);
const MATT_1_1 = verseIndex('Matt', 1, 1);
const PS_1_1 = verseIndex('Ps', 1, 1);

function computeStats() {
  const index = new CrossReferenceIndex(
    createCrossReferenceColumns([
      { from: GEN_1_1, to: JOHN_1_1, votes: 10 },
      { from: JOHN_1_1, to: GEN_1_1, votes: 5 },
      { from: GEN_1_1, to: GEN_1_1, toEnd: GEN_1_3, votes: -2 },
      { from: MATT_1_1, to: verseIndex('Luke', 3, 23), toEnd: verseIndex('Luke', 3, 38), votes: 1 },
      { from: PS_1_1, to: verseIndex('Gen', 50, 26), toEnd: verseIndex('Exod', 1, 1), votes: 0 },
    ]),
    CANONICAL_VERSIFICATION.verseCount,
  );
  return { index, stats: computeCrossReferenceStats(index, CANONICAL_VERSIFICATION) };
}

describe('computeCrossReferenceStats', () => {
  it('counts links, ranges and pairs', () => {
    const { stats } = computeStats();
    expect(stats).toMatchObject({
      linkCount: 5,
      sourceVerseCount: 4,
      rangeLinkCount: 3,
      crossChapterRangeCount: 0,
      crossBookRangeCount: 1,
      selfInclusiveLinkCount: 1,
      distinctPairCount: 4,
      reciprocalPairCount: 1,
    });
  });

  it('finds unconnected verses, expanding target ranges', () => {
    const { stats } = computeStats();
    // Targets: John 1:1, Gen 1:1–3, Luke 3:23–38 (16 verses), Gen 50:26 and Exod 1:1.
    expect(stats.targetVerseCount).toBe(22);
    // Connected: those 22 plus the sources Matt 1:1 and Ps 1:1.
    expect(stats.unconnectedVerses).toHaveLength(31102 - 24);
  });

  it('summarizes votes', () => {
    const { votes } = computeStats().stats;
    expect(votes).toMatchObject({ min: -2, max: 10, median: 1, mean: 2.8 });
    expect(votes.histogram.find((bucket) => bucket.label === '< 0')?.count).toBe(1);
    expect(votes.thresholds.find((threshold) => threshold.minVotes === 5)?.count).toBe(2);
  });

  it('breaks links down by testament and book', () => {
    const { stats } = computeStats();
    expect(stats.testamentFlow).toEqual({ OT: { OT: 2, NT: 1 }, NT: { OT: 1, NT: 1 } });
    expect(stats.books.find((row) => row.book.id === 'Gen')).toMatchObject({
      outgoing: 2,
      incoming: 3,
      verseCount: 1533,
    });
  });

  it('ranks the most voted links', () => {
    const { index, stats } = computeStats();
    expect(stats.topVotedLinkIds.map((id) => index.link(id).votes)).toEqual([10, 5, 1]);
    expect(stats.topSources[0]).toEqual({ verse: GEN_1_1, count: 2 });
  });
});

describe('topPositions', () => {
  it('returns positions of the largest positive values, ties broken by position', () => {
    expect(topPositions([3, 0, 5, 3, -1], 3)).toEqual([2, 0, 3]);
  });
});
