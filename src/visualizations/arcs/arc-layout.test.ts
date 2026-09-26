import { describe, expect, it } from 'vitest';
import { alongToVerse, computeArcLayout, pixelsPerVerse, verseToAlong } from './arc-layout.ts';

describe('computeArcLayout', () => {
  it('uses a horizontal axis on landscape screens and a vertical one on portrait screens', () => {
    expect(computeArcLayout(1400, 800).orientation).toBe('horizontal');
    expect(computeArcLayout(390, 700).orientation).toBe('vertical');
  });

  it('keeps arcs inside the stage', () => {
    const wide = computeArcLayout(1400, 800);
    expect(wide.baseline - wide.maxArcHeight).toBeGreaterThanOrEqual(0);
    const tall = computeArcLayout(390, 700);
    expect(tall.baseline + tall.maxArcHeight).toBeLessThanOrEqual(390);
  });

  it('maps verses to pixels and back', () => {
    const layout = computeArcLayout(1000, 600);
    const view = { start: 100, end: 1100 };
    expect(pixelsPerVerse(layout, view)).toBeCloseTo((layout.axisEnd - layout.axisStart) / 1000);
    expect(alongToVerse(layout, view, verseToAlong(layout, view, 567.5))).toBeCloseTo(567.5);
    expect(verseToAlong(layout, view, 100)).toBe(layout.axisStart);
  });
});
