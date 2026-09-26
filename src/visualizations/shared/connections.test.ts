import { describe, expect, it } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../core/bible/versification.ts';
import { CrossReferenceIndex } from '../../cross-references/cross-reference-index.ts';
import { createCrossReferenceColumns, verseIndex } from '../../test-utils/fixtures.ts';
import { collectConnections, groupByBook } from './connections.ts';
import { createLinkFilter } from './link-filter.ts';
import { computeVerseGenres } from './verse-genres.ts';

const verseGenres = computeVerseGenres(CANONICAL_VERSIFICATION);
const JOHN_3_16 = verseIndex('John', 3, 16);
const JOHN_3_17 = verseIndex('John', 3, 17);
const ROM_5_8 = verseIndex('Rom', 5, 8);
const ROM_8_32 = verseIndex('Rom', 8, 32);
const GEN_22_2 = verseIndex('Gen', 22, 2);

const index = new CrossReferenceIndex(
  createCrossReferenceColumns([
    { from: JOHN_3_16, to: ROM_8_32, votes: 510 },
    { from: JOHN_3_16, to: ROM_5_8, votes: 983 },
    { from: JOHN_3_17, to: GEN_22_2, votes: 1 },
    // An incoming link to a range covering both John 3:16 and 3:17 must be counted once.
    { from: GEN_22_2, to: JOHN_3_16, toEnd: JOHN_3_17, votes: 7 },
    { from: ROM_5_8, to: JOHN_3_16, votes: -2 },
  ]),
  CANONICAL_VERSIFICATION.verseCount,
);

describe('collectConnections', () => {
  it('lists outgoing and incoming links of a verse, sorted by the other end', () => {
    const result = collectConnections(
      index,
      { start: JOHN_3_16, end: JOHN_3_16 },
      createLinkFilter(-Infinity),
      verseGenres,
    );
    expect(result.outgoing.map((c) => c.otherStart)).toEqual([ROM_5_8, ROM_8_32]);
    expect(result.incoming.map((c) => c.otherStart)).toEqual([GEN_22_2, ROM_5_8]);
  });

  it('counts a link into a range spanning several verses of the passage once', () => {
    const passage = { start: JOHN_3_16, end: JOHN_3_17 };
    const all = collectConnections(index, passage, createLinkFilter(-Infinity), verseGenres);
    expect(all.outgoing).toHaveLength(3);
    expect(all.incoming).toHaveLength(2);
    const filtered = collectConnections(index, passage, createLinkFilter(0), verseGenres);
    expect(filtered.incoming.map((c) => c.link.votes)).toEqual([7]);
  });
});

describe('groupByBook', () => {
  it('groups consecutive connections by the book of the other end', () => {
    const { outgoing } = collectConnections(
      index,
      { start: JOHN_3_16, end: JOHN_3_17 },
      createLinkFilter(-Infinity),
      verseGenres,
    );
    expect(
      groupByBook(outgoing, CANONICAL_VERSIFICATION).map((group) => [
        group.book,
        group.connections.length,
      ]),
    ).toEqual([
      ['Gen', 1],
      ['Rom', 2],
    ]);
  });
});
