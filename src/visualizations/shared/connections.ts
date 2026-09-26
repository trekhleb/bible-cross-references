import type { BookId } from '../../core/bible/books.ts';
import { formatVerseIndexRange } from '../../core/bible/reference-format.ts';
import type { VerseIndex } from '../../core/bible/verse-ref.ts';
import type { VerseIndexRange, Versification } from '../../core/bible/versification.ts';
import type {
  CrossReferenceIndex,
  CrossReferenceLink,
} from '../../cross-references/cross-reference-index.ts';
import { compileLinkFilter, type LinkFilter } from './link-filter.ts';

export type LinkDirection = 'outgoing' | 'incoming';

/** A link seen from a passage: where its other end is. */
export interface Connection {
  readonly link: CrossReferenceLink;
  readonly direction: LinkDirection;
  /** The verse inside the passage. */
  readonly here: VerseIndex;
  /** The other end: the target range (outgoing) or the source verse (incoming). */
  readonly otherStart: VerseIndex;
  readonly otherEnd: VerseIndex;
}

export interface PassageConnections {
  /** Links from verses of the passage (what the passage references). */
  readonly outgoing: readonly Connection[];
  /** Links into verses of the passage (what references the passage). */
  readonly incoming: readonly Connection[];
}

function byOtherEnd(a: Connection, b: Connection): number {
  return a.otherStart - b.otherStart || a.otherEnd - b.otherEnd || a.here - b.here;
}

/** All connections of a verse range, filtered, each list sorted by where the other end is. */
export function collectConnections(
  index: CrossReferenceIndex,
  range: VerseIndexRange,
  filter: LinkFilter,
  verseGenres: Uint8Array,
): PassageConnections {
  const passes = compileLinkFilter(filter, verseGenres);
  const outgoing: Connection[] = [];
  const incoming: Connection[] = [];
  const seenIncoming = new Set<number>();

  for (let verse = range.start; verse <= range.end; verse += 1) {
    for (const link of index.outgoing(verse)) {
      if (passes(link.from, link.targetStart, link.votes)) {
        outgoing.push({
          link,
          direction: 'outgoing',
          here: verse,
          otherStart: link.targetStart,
          otherEnd: link.targetEnd,
        });
      }
    }
    for (const link of index.incoming(verse)) {
      // A link to a range spanning several verses of the passage is counted once.
      if (seenIncoming.has(link.id)) {
        continue;
      }
      seenIncoming.add(link.id);
      if (passes(link.from, link.targetStart, link.votes)) {
        incoming.push({
          link,
          direction: 'incoming',
          here: verse,
          otherStart: link.from,
          otherEnd: link.from,
        });
      }
    }
  }

  return {
    outgoing: outgoing.sort(byOtherEnd),
    incoming: incoming.sort(byOtherEnd),
  };
}

export interface BookGroup {
  readonly book: BookId;
  readonly connections: readonly Connection[];
}

/**
 * Where a connection meets the passage, when its reference alone doesn't say, or `null`:
 * - a link into several verses names them all, since it's listed under each of them (Matthew
 *   24:37 points to all of Genesis 6:1–7, not to 6:1 alone);
 * - in a chapter, every other link names the chapter's verse it starts or lands on.
 */
export function landingNote(
  connection: Connection,
  versification: Versification,
  inChapter: boolean,
): string | null {
  const { link, direction } = connection;
  if (direction === 'incoming' && link.targetEnd !== link.targetStart) {
    return `to ${formatVerseIndexRange(versification, link.targetStart, link.targetEnd)}`;
  }
  if (!inChapter) {
    return null;
  }
  const verse = versification.refAt(connection.here).verse;
  return `${direction === 'outgoing' ? 'from' : 'to'} v. ${String(verse)}`;
}

/** Groups connections (already sorted by their other end) by the book of the other end. */
export function groupByBook(
  connections: readonly Connection[],
  versification: Versification,
): BookGroup[] {
  const groups: { book: BookId; connections: Connection[] }[] = [];
  for (const connection of connections) {
    const book = versification.bookAt(connection.otherStart).id;
    const last = groups.at(-1);
    if (last?.book === book) {
      last.connections.push(connection);
    } else {
      groups.push({ book, connections: [connection] });
    }
  }
  return groups;
}

/** Unique IDs of the links behind a set of connections (outgoing and incoming together). */
export function connectionLinkIds(connections: PassageConnections): number[] {
  const ids = new Set<number>();
  for (const connection of [...connections.outgoing, ...connections.incoming]) {
    ids.add(connection.link.id);
  }
  return [...ids];
}
