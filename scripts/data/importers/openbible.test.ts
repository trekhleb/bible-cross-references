import { describe, expect, it } from 'vitest';
import { PROVENANCE, verseIndex } from '../../../src/test-utils/fixtures.ts';
import { importOpenBibleCrossReferences } from './openbible.ts';

const HEADER = 'From Verse\tTo Verse\tVotes\t#www.openbible.info CC-BY 2026-09-21';
const { url, sha256, retrievedAt } = PROVENANCE;
const provenance = { url, sha256, retrievedAt };

function importRows(rows: readonly string[], header = HEADER) {
  return importOpenBibleCrossReferences([header, ...rows, ''].join('\n'), provenance);
}

describe('importOpenBibleCrossReferences', () => {
  it('imports links grouped by source verse and sorted by votes', () => {
    const file = importRows([
      'John.1.1\tGen.1.1\t5',
      'Gen.1.1\tJohn.1.1-John.1.3\t10',
      'Gen.1.1\tRev.3.14\t47',
    ]);
    const gen11 = verseIndex('Gen', 1, 1);
    const john11 = verseIndex('John', 1, 1);

    expect(file).toMatchObject({
      format: 'cross-references',
      sourceId: 'openbible',
      sourceRowCount: 3,
      provenance: { ...provenance, snapshotDate: '2026-09-21' },
      notices: [],
    });
    expect(file.links.targetStart).toEqual([verseIndex('Rev', 3, 14), john11, gen11]);
    expect(file.links.targetEnd).toEqual([
      verseIndex('Rev', 3, 14),
      verseIndex('John', 1, 3),
      gen11,
    ]);
    expect(file.links.votes).toEqual([47, 10, 5]);
    expect(file.links.offsets).toHaveLength(31103);
    expect(file.links.offsets.slice(0, 2)).toEqual([0, 2]);
    expect(file.links.offsets[john11]).toBe(2);
    expect(file.links.offsets[john11 + 1]).toBe(3);
    expect(file.links.offsets.at(-1)).toBe(3);
  });

  it('remaps verses missing from the KJV versification', () => {
    const file = importRows(['3John.1.15\tJohn.10.3\t1', 'Acts.11.30\t2John.1.1-3John.1.15\t2']);
    expect(file.links.targetEnd).toContain(verseIndex('3John', 1, 14));
    expect(file.notices).toEqual([expect.objectContaining({ level: 'info', count: 2 })]);
  });

  it('drops duplicate rows and reports them', () => {
    const file = importRows(['Gen.1.1\tJohn.1.1\t3', 'Gen.1.1\tJohn.1.1\t4']);
    expect(file.links.votes).toEqual([3]);
    expect(file.notices).toEqual([expect.objectContaining({ level: 'warning', count: 1 })]);
  });

  it('reports a missing snapshot date', () => {
    const file = importRows(['Gen.1.1\tJohn.1.1\t3'], 'From Verse\tTo Verse\tVotes');
    expect(file.provenance.snapshotDate).toBeNull();
    expect(file.notices).toEqual([expect.objectContaining({ level: 'warning' })]);
  });

  it.each([
    ['an unexpected header', [], 'Verse\tTarget', 'unexpected header'],
    ['an unknown verse', ['Gen.1.99\tJohn.1.1\t3'], HEADER, 'unknown verse "Gen.1.99"'],
    ['an unknown book', ['Gen.1.1\tHez.1.1\t3'], HEADER, 'unknown verse "Hez.1.1"'],
    ['a malformed row', ['Gen.1.1\tJohn.1.1'], HEADER, 'malformed row'],
    ['non-integer votes', ['Gen.1.1\tJohn.1.1\tmany'], HEADER, 'malformed row'],
    ['a reversed range', ['Gen.1.1\tJohn.1.3-John.1.1\t1'], HEADER, 'reversed range'],
  ])('rejects %s', (_, rows, header, message) => {
    expect(() => importRows(rows, header)).toThrow(message);
  });
});
