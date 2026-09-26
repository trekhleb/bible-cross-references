import { describe, expect, it } from 'vitest';
import { wheelZoomFactor } from './gestures.ts';

describe('wheelZoomFactor', () => {
  it('zooms in when scrolling up and out when scrolling down', () => {
    expect(wheelZoomFactor(-100, 0, false)).toBeGreaterThan(1);
    expect(wheelZoomFactor(100, 0, false)).toBeLessThan(1);
    expect(wheelZoomFactor(0, 0, false)).toBe(1);
  });

  it('is symmetric, so zooming in and back out restores the scale', () => {
    expect(wheelZoomFactor(-50, 0, false) * wheelZoomFactor(50, 0, false)).toBeCloseTo(1);
  });

  it('normalizes line-based deltas and treats trackpad pinches as stronger', () => {
    expect(wheelZoomFactor(1, 1, false)).toBeCloseTo(wheelZoomFactor(16, 0, false));
    expect(wheelZoomFactor(-10, 0, true)).toBeGreaterThan(wheelZoomFactor(-10, 0, false));
  });
});
