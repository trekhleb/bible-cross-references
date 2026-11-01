import { describe, expect, it } from 'vitest';
import {
  clampView,
  fullView,
  interpolateView,
  MIN_VIEW_SPAN,
  panView,
  revealRange,
  zoomView,
} from './axis-view.ts';

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

  /**
   * A NaN or an infinity that reached the window used to stay there for good: the arcs and the
   * book bar vanished, and the next hover crashed the view looking up verse NaN. A step whose
   * arithmetic fails is dropped instead, and the window stays where it was.
   */
  describe('a step that cannot be worked out', () => {
    const view = { start: 100, end: 2100 };

    it('does not zoom', () => {
      expect(zoomView(view, Number.NaN, 500, TOTAL)).toBe(view);
      expect(zoomView(view, 1.2, Number.NaN, TOTAL)).toBe(view);
      // What a stage with no axis length gives: zero pixels per verse, so an anchor at infinity.
      expect(zoomView(view, 1.2, Number.NEGATIVE_INFINITY, TOTAL)).toBe(view);
      expect(zoomView(view, 1.2, Number.POSITIVE_INFINITY, TOTAL)).toBe(view);
    });

    it('does not pan', () => {
      expect(panView(view, Number.NaN, TOTAL)).toBe(view);
      expect(panView(view, Number.POSITIVE_INFINITY, TOTAL)).toBe(view);
    });

    it('does not reveal', () => {
      expect(revealRange(view, Number.NaN, Number.NaN, TOTAL)).toBe(view);
    });

    it('does not animate', () => {
      expect(interpolateView(view, fullView(TOTAL), Number.NaN)).toBe(view);
    });

    /** Overflowing the zoom factor is not a failure: it still zooms as far as it can go. */
    it('still zooms all the way when the factor runs to zero or to infinity', () => {
      expect(zoomView(view, 0, 500, TOTAL)).toEqual(fullView(TOTAL));
      const closest = zoomView(view, Number.POSITIVE_INFINITY, 500, TOTAL);
      expect(closest.end - closest.start).toBeCloseTo(MIN_VIEW_SPAN, 9);
    });
  });
});
