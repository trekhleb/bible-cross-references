import { describe, expect, it } from 'vitest';
import { createCrossReferenceColumns } from '../test-utils/fixtures.ts';
import { CrossReferenceIndex, CrossReferenceIntegrityError } from './cross-reference-index.ts';

// A toy versification of 6 verses (indices 0–5).
const VERSE_COUNT = 6;

function createIndex() {
  return new CrossReferenceIndex(
    createCrossReferenceColumns(
      [
        { from: 0, to: 3, votes: 5 },
        { from: 0, to: 1, toEnd: 3, votes: 2 },
        { from: 2, to: 0, votes: -1 },
        { from: 5, to: 4, toEnd: 5, votes: 7 },
      ],
      VERSE_COUNT,
    ),
    VERSE_COUNT,
  );
}

describe('CrossReferenceIndex', () => {
  it('looks up outgoing links', () => {
    const index = createIndex();
    expect(index.linkCount).toBe(4);
    expect(index.outgoing(0).map((link) => [link.targetStart, link.targetEnd])).toEqual([
      [3, 3],
      [1, 3],
    ]);
    expect(index.outgoing(1)).toEqual([]);
    expect(index.outgoingCount(0)).toBe(2);
  });

  it('indexes incoming links under every verse of the target range', () => {
    const index = createIndex();
    expect(index.incoming(3).map((link) => link.from)).toEqual([0, 0]);
    expect(index.incoming(2).map((link) => link.from)).toEqual([0]);
    expect(index.incoming(5).map((link) => link.from)).toEqual([5]);
    expect(index.incomingCount(0)).toBe(1);
  });

  it('exposes complete links', () => {
    expect(createIndex().link(2)).toEqual({
      id: 2,
      from: 2,
      targetStart: 0,
      targetEnd: 0,
      votes: -1,
    });
  });

  it('rejects inconsistent columns', () => {
    const columns = createCrossReferenceColumns([{ from: 0, to: 1 }], VERSE_COUNT);
    expect(() => new CrossReferenceIndex(columns, VERSE_COUNT + 1)).toThrow(
      CrossReferenceIntegrityError,
    );
    expect(
      () => new CrossReferenceIndex({ ...columns, targetStart: [4], targetEnd: [2] }, VERSE_COUNT),
    ).toThrow('link 0 has an invalid target range');
  });
});
