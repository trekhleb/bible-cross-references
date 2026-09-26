import { BOOKS, type Book, type Testament } from '../../../core/bible/books.ts';
import type { VerseIndex } from '../../../core/bible/verse-ref.ts';
import type { Versification } from '../../../core/bible/versification.ts';
import { elementAt } from '../../../core/lib/array.ts';
import type { CrossReferenceIndex } from '../../../cross-references/cross-reference-index.ts';
import { topPositions } from './top-k.ts';

export interface VerseCount {
  readonly verse: VerseIndex;
  readonly count: number;
}

export interface VoteBucket {
  readonly label: string;
  readonly count: number;
}

export interface VoteThreshold {
  readonly minVotes: number;
  readonly count: number;
}

export interface VoteStats {
  readonly min: number;
  readonly max: number;
  readonly mean: number;
  readonly median: number;
  readonly histogram: readonly VoteBucket[];
  readonly thresholds: readonly VoteThreshold[];
}

export interface BookLinkStats {
  readonly book: Book;
  readonly verseCount: number;
  /** Links whose source verse is in the book. */
  readonly outgoing: number;
  /** Links whose target starts in the book. */
  readonly incoming: number;
}

export type TestamentFlow = Readonly<Record<Testament, Readonly<Record<Testament, number>>>>;

export interface CrossReferenceStats {
  readonly linkCount: number;
  /** Verses with at least one outgoing link. */
  readonly sourceVerseCount: number;
  /** Verses covered by at least one link target (ranges expanded). */
  readonly targetVerseCount: number;
  /** Verses with neither outgoing nor incoming links. */
  readonly unconnectedVerses: readonly VerseIndex[];
  readonly rangeLinkCount: number;
  readonly crossChapterRangeCount: number;
  readonly crossBookRangeCount: number;
  /** Links whose target range contains their own source verse. */
  readonly selfInclusiveLinkCount: number;
  readonly longestRangeLinkId: number | undefined;
  /** Distinct unordered verse pairs, taking the first verse of each target range. */
  readonly distinctPairCount: number;
  /** Pairs linked in both directions (A → B and B → A). */
  readonly reciprocalPairCount: number;
  readonly votes: VoteStats;
  /** Link counts by source testament (rows) and target testament (columns). */
  readonly testamentFlow: TestamentFlow;
  readonly topSources: readonly VerseCount[];
  readonly topTargets: readonly VerseCount[];
  readonly topVotedLinkIds: readonly number[];
  readonly books: readonly BookLinkStats[];
}

const TOP_COUNT = 10;
const VOTE_THRESHOLDS = [1, 5, 10, 20, 50, 100] as const;
const VOTE_BUCKETS: readonly {
  readonly label: string;
  readonly min: number;
  readonly max: number;
}[] = [
  { label: '< 0', min: -Infinity, max: -1 },
  { label: '0', min: 0, max: 0 },
  { label: '1–4', min: 1, max: 4 },
  { label: '5–9', min: 5, max: 9 },
  { label: '10–19', min: 10, max: 19 },
  { label: '20–49', min: 20, max: 49 },
  { label: '50–99', min: 50, max: 99 },
  { label: '≥ 100', min: 100, max: Infinity },
];

function computeVoteStats(votes: ArrayLike<number>): VoteStats {
  const sorted = Int32Array.from(votes).sort();
  const count = sorted.length;
  if (count === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, histogram: [], thresholds: [] };
  }
  const sum = sorted.reduce((total, value) => total + value, 0);
  const middle = Math.floor(count / 2);
  const median =
    count % 2 === 0
      ? (elementAt(sorted, middle - 1) + elementAt(sorted, middle)) / 2
      : elementAt(sorted, middle);
  return {
    min: elementAt(sorted, 0),
    max: elementAt(sorted, count - 1),
    mean: sum / count,
    median,
    histogram: VOTE_BUCKETS.map(({ label, min, max }) => ({
      label,
      count: sorted.filter((value) => value >= min && value <= max).length,
    })),
    thresholds: VOTE_THRESHOLDS.map((minVotes) => ({
      minVotes,
      count: sorted.filter((value) => value >= minVotes).length,
    })),
  };
}

export function computeCrossReferenceStats(
  index: CrossReferenceIndex,
  versification: Versification,
): CrossReferenceStats {
  const { verseCount, linkCount } = index;
  const outgoingCounts = new Int32Array(verseCount);
  const incomingCounts = new Int32Array(verseCount);
  const bookOutgoing = new Int32Array(BOOKS.length);
  const bookIncoming = new Int32Array(BOOKS.length);
  const flow: Record<Testament, Record<Testament, number>> = {
    OT: { OT: 0, NT: 0 },
    NT: { OT: 0, NT: 0 },
  };
  const directedPairs = new Set<number>();

  let rangeLinkCount = 0;
  let crossChapterRangeCount = 0;
  let crossBookRangeCount = 0;
  let selfInclusiveLinkCount = 0;
  let longestRangeLinkId: number | undefined;
  let longestRangeLength = 1;

  for (let id = 0; id < linkCount; id += 1) {
    const link = index.link(id);
    const fromBook = versification.bookAt(link.from);
    const targetBook = versification.bookAt(link.targetStart);

    outgoingCounts[link.from] = elementAt(outgoingCounts, link.from) + 1;
    for (let verse = link.targetStart; verse <= link.targetEnd; verse += 1) {
      incomingCounts[verse] = elementAt(incomingCounts, verse) + 1;
    }
    bookOutgoing[fromBook.ordinal] = elementAt(bookOutgoing, fromBook.ordinal) + 1;
    bookIncoming[targetBook.ordinal] = elementAt(bookIncoming, targetBook.ordinal) + 1;
    flow[fromBook.testament][targetBook.testament] += 1;
    directedPairs.add(link.from * verseCount + link.targetStart);

    if (link.targetStart <= link.from && link.from <= link.targetEnd) {
      selfInclusiveLinkCount += 1;
    }
    const rangeLength = link.targetEnd - link.targetStart + 1;
    if (rangeLength > 1) {
      rangeLinkCount += 1;
      const start = versification.refAt(link.targetStart);
      const end = versification.refAt(link.targetEnd);
      if (start.book !== end.book) {
        crossBookRangeCount += 1;
      } else if (start.chapter !== end.chapter) {
        crossChapterRangeCount += 1;
      }
      if (rangeLength > longestRangeLength) {
        longestRangeLength = rangeLength;
        longestRangeLinkId = id;
      }
    }
  }

  let distinctPairCount = 0;
  let reciprocalPairCount = 0;
  for (const key of directedPairs) {
    const from = Math.floor(key / verseCount);
    const to = key % verseCount;
    const hasReverse = directedPairs.has(to * verseCount + from);
    // Count each unordered pair once: from its lower-numbered side when both directions exist
    // (a verse linked to a range starting at itself is its own reverse).
    if (!hasReverse || from <= to) {
      distinctPairCount += 1;
    }
    if (hasReverse && from < to) {
      reciprocalPairCount += 1;
    }
  }

  const unconnectedVerses: VerseIndex[] = [];
  let sourceVerseCount = 0;
  let targetVerseCount = 0;
  for (let verse = 0; verse < verseCount; verse += 1) {
    const hasOutgoing = elementAt(outgoingCounts, verse) > 0;
    const hasIncoming = elementAt(incomingCounts, verse) > 0;
    sourceVerseCount += hasOutgoing ? 1 : 0;
    targetVerseCount += hasIncoming ? 1 : 0;
    if (!hasOutgoing && !hasIncoming) {
      unconnectedVerses.push(verse);
    }
  }

  const toVerseCounts = (counts: Int32Array): VerseCount[] =>
    topPositions(counts, TOP_COUNT).map((verse) => ({
      verse,
      count: elementAt(counts, verse),
    }));

  return {
    linkCount,
    sourceVerseCount,
    targetVerseCount,
    unconnectedVerses,
    rangeLinkCount,
    crossChapterRangeCount,
    crossBookRangeCount,
    selfInclusiveLinkCount,
    longestRangeLinkId,
    distinctPairCount,
    reciprocalPairCount,
    votes: computeVoteStats(index.votes),
    testamentFlow: flow,
    topSources: toVerseCounts(outgoingCounts),
    topTargets: toVerseCounts(incomingCounts),
    topVotedLinkIds: topPositions(index.votes, TOP_COUNT),
    books: BOOKS.map((book) => {
      const range = versification.bookRange(book.id);
      return {
        book,
        verseCount: range.end - range.start + 1,
        outgoing: elementAt(bookOutgoing, book.ordinal),
        incoming: elementAt(bookIncoming, book.ordinal),
      };
    }),
  };
}
