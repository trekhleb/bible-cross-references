import { describe, expect, it } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../core/bible/versification.ts';
import { computeSpineLayout } from './spine-layout.ts';

const layout = computeSpineLayout(CANONICAL_VERSIFICATION, 40, 840, { book: 1, genre: 6 });

describe('computeSpineLayout', () => {
  it('stacks all 66 books in order within the bounds', () => {
    expect(layout.segments).toHaveLength(66);
    expect(layout.segments[0]?.top).toBe(40);
    expect(layout.segments.at(-1)?.bottom).toBeCloseTo(840);
    layout.segments.forEach((segment, index) => {
      const next = layout.segments[index + 1];
      if (next) {
        expect(next.top).toBeGreaterThan(segment.bottom);
      }
    });
  });

  it('leaves bigger gaps between genres than between books', () => {
    const [genesis, exodus] = layout.segments;
    const deuteronomy = layout.segments[4];
    const joshua = layout.segments[5];
    expect((exodus?.top ?? 0) - (genesis?.bottom ?? 0)).toBeCloseTo(1);
    expect((joshua?.top ?? 0) - (deuteronomy?.bottom ?? 0)).toBeCloseTo(6);
  });

  it('maps verses to positions and back', () => {
    for (const verse of [0, 1234, 23145, 31101]) {
      expect(layout.verseAt(layout.yOf(verse))).toBe(verse);
    }
    expect(layout.verseAt(10)).toBeNull();
  });
});
