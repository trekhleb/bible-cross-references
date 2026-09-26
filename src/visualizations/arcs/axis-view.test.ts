import { describe, expect, it } from 'vitest';
import { clampView, fullView, MIN_VIEW_SPAN, panView, revealRange, zoomView } from './axis-view.ts';

const TOTAL = 31102;

describe('axis view', () => {
  it('keeps the window inside the axis', () => {
    expect(clampView({ start: -50, end: 100 }, TOTAL)).toEqual({ start: 0, end: 150 });
    expect(clampView({ start: TOTAL - 10, end: TOTAL + 40 }, TOTAL)).toEqual({
      start: TOTAL - 50,
      end: TOTAL,
    });
    expect(clampView({ start: 5, end: 6 }, TOTAL).end - 5).toBe(MIN_VIEW_SPAN);
  });

  it('zooms around the anchor', () => {
    const view = zoomView(fullView(TOTAL), 2, 10000, TOTAL);
    expect(view.end - view.start).toBeCloseTo(TOTAL / 2);
    // The anchor keeps its relative position in the window.
    expect((10000 - view.start) / (view.end - view.start)).toBeCloseTo(10000 / TOTAL);
  });

  it('never zooms beyond the whole axis or the minimum span', () => {
    expect(zoomView(fullView(TOTAL), 0.1, 500, TOTAL)).toEqual(fullView(TOTAL));
    const deep = zoomView({ start: 100, end: 200 }, 100, 150, TOTAL);
    expect(deep.end - deep.start).toBe(MIN_VIEW_SPAN);
  });

  it('pans within bounds', () => {
    expect(panView({ start: 0, end: 1000 }, -500, TOTAL)).toEqual({ start: 0, end: 1000 });
    expect(panView({ start: 0, end: 1000 }, 250, TOTAL)).toEqual({ start: 250, end: 1250 });
  });

  it('reveals a range only when it is not visible', () => {
    const view = { start: 0, end: 1000 };
    expect(revealRange(view, 10, 20, TOTAL)).toBe(view);
    expect(revealRange(view, 5000, 5010, TOTAL)).toEqual({ start: 4505, end: 5505 });
  });
});
