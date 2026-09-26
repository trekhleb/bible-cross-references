import type { VerseIndex } from '../core/bible/verse-ref.ts';
import type { CrossReferenceColumns } from '../core/datasets/formats.ts';
import { elementAt } from '../core/lib/array.ts';

/** One cross-reference: from a verse to a verse or an inclusive range of verses. */
export interface CrossReferenceLink {
  /** Position of the link in its dataset. Stable for a given dataset file. */
  readonly id: number;
  readonly from: VerseIndex;
  readonly targetStart: VerseIndex;
  readonly targetEnd: VerseIndex;
  readonly votes: number;
}

export class CrossReferenceIntegrityError extends Error {
  constructor(message: string) {
    super(`Invalid cross-reference data: ${message}`);
    this.name = 'CrossReferenceIntegrityError';
  }
}

/**
 * Cross-references indexed for O(1) lookup in both directions.
 *
 * Outgoing links come straight from the dataset's CSR layout. Incoming links are indexed under
 * every verse of a link's target range, so a link to Romans 1:19–20 is an incoming link of both
 * verses. The per-link columns are exposed read-only for bulk analytics.
 */
export class CrossReferenceIndex {
  readonly verseCount: number;
  readonly linkCount: number;
  /** Source verse of each link, by link ID. */
  readonly sources: ArrayLike<VerseIndex>;
  readonly targetStarts: ArrayLike<VerseIndex>;
  readonly targetEnds: ArrayLike<VerseIndex>;
  readonly votes: ArrayLike<number>;

  readonly #outgoingOffsets: Int32Array;
  readonly #incomingOffsets: Int32Array;
  readonly #incomingLinkIds: Int32Array;

  constructor(columns: CrossReferenceColumns, verseCount: number) {
    const linkCount = columns.targetStart.length;
    validateColumns(columns, verseCount, linkCount);

    this.verseCount = verseCount;
    this.linkCount = linkCount;
    this.#outgoingOffsets = Int32Array.from(columns.offsets);
    this.targetStarts = Int32Array.from(columns.targetStart);
    this.targetEnds = Int32Array.from(columns.targetEnd);
    this.votes = Int32Array.from(columns.votes);

    const sources = new Int32Array(linkCount);
    for (let verse = 0; verse < verseCount; verse += 1) {
      sources.fill(verse, this.#outgoingStart(verse), this.#outgoingEnd(verse));
    }
    this.sources = sources;

    // Incoming index: counting sort of (target verse, link ID) pairs over the expanded ranges.
    const incomingOffsets = new Int32Array(verseCount + 1);
    for (let id = 0; id < linkCount; id += 1) {
      for (let verse = this.#targetStart(id); verse <= this.#targetEnd(id); verse += 1) {
        incomingOffsets[verse + 1] = elementAt(incomingOffsets, verse + 1) + 1;
      }
    }
    for (let verse = 0; verse < verseCount; verse += 1) {
      incomingOffsets[verse + 1] =
        elementAt(incomingOffsets, verse + 1) + elementAt(incomingOffsets, verse);
    }
    const cursors = incomingOffsets.slice(0, verseCount);
    const incomingLinkIds = new Int32Array(elementAt(incomingOffsets, verseCount));
    for (let id = 0; id < linkCount; id += 1) {
      for (let verse = this.#targetStart(id); verse <= this.#targetEnd(id); verse += 1) {
        const cursor = elementAt(cursors, verse);
        incomingLinkIds[cursor] = id;
        cursors[verse] = cursor + 1;
      }
    }
    this.#incomingOffsets = incomingOffsets;
    this.#incomingLinkIds = incomingLinkIds;
  }

  link(id: number): CrossReferenceLink {
    return {
      id,
      from: elementAt(this.sources, id),
      targetStart: this.#targetStart(id),
      targetEnd: this.#targetEnd(id),
      votes: elementAt(this.votes, id),
    };
  }

  /** Links from `verse`, in dataset order. */
  outgoing(verse: VerseIndex): CrossReferenceLink[] {
    const links: CrossReferenceLink[] = [];
    for (let id = this.#outgoingStart(verse); id < this.#outgoingEnd(verse); id += 1) {
      links.push(this.link(id));
    }
    return links;
  }

  /** Links whose target range contains `verse`, in dataset order. */
  incoming(verse: VerseIndex): CrossReferenceLink[] {
    const start = elementAt(this.#incomingOffsets, verse);
    const end = elementAt(this.#incomingOffsets, verse + 1);
    return Array.from(this.#incomingLinkIds.subarray(start, end), (id) => this.link(id));
  }

  outgoingCount(verse: VerseIndex): number {
    return this.#outgoingEnd(verse) - this.#outgoingStart(verse);
  }

  incomingCount(verse: VerseIndex): number {
    return elementAt(this.#incomingOffsets, verse + 1) - elementAt(this.#incomingOffsets, verse);
  }

  #outgoingStart(verse: VerseIndex): number {
    return elementAt(this.#outgoingOffsets, verse);
  }

  #outgoingEnd(verse: VerseIndex): number {
    return elementAt(this.#outgoingOffsets, verse + 1);
  }

  #targetStart(id: number): VerseIndex {
    return elementAt(this.targetStarts, id);
  }

  #targetEnd(id: number): VerseIndex {
    return elementAt(this.targetEnds, id);
  }
}

function validateColumns(columns: CrossReferenceColumns, verseCount: number, linkCount: number) {
  const { offsets, targetStart, targetEnd, votes } = columns;
  if (offsets.length !== verseCount + 1) {
    throw new CrossReferenceIntegrityError(
      `expected ${verseCount + 1} offsets, got ${offsets.length}.`,
    );
  }
  if (targetEnd.length !== linkCount || votes.length !== linkCount) {
    throw new CrossReferenceIntegrityError('link columns have different lengths.');
  }
  if (offsets[0] !== 0 || offsets[verseCount] !== linkCount) {
    throw new CrossReferenceIntegrityError(`offsets must span links 0 to ${linkCount}.`);
  }
  for (let verse = 0; verse < verseCount; verse += 1) {
    if (elementAt(offsets, verse) > elementAt(offsets, verse + 1)) {
      throw new CrossReferenceIntegrityError(`offsets decrease at verse ${verse}.`);
    }
  }
  for (let id = 0; id < linkCount; id += 1) {
    const start = elementAt(targetStart, id);
    const end = elementAt(targetEnd, id);
    if (start < 0 || end >= verseCount || start > end) {
      throw new CrossReferenceIntegrityError(`link ${id} has an invalid target range.`);
    }
  }
}
