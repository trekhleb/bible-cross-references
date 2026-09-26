import type { AxisView } from './axis-view.ts';

export type Orientation = 'horizontal' | 'vertical';

/**
 * Where the axis and the arcs sit on screen. "Along" is the axis direction (x when horizontal,
 * y when vertical); "across" is the direction the arcs rise in.
 */
export interface ArcLayout {
  readonly orientation: Orientation;
  readonly width: number;
  readonly height: number;
  /** Along-axis pixel range covered by the visible window. */
  readonly axisStart: number;
  readonly axisEnd: number;
  /** Across-axis pixel coordinate of the axis line. */
  readonly baseline: number;
  /** Arcs never rise further than this from the axis (far links flatten into a ceiling). */
  readonly maxArcHeight: number;
}

const EDGE_MARGIN = 16;
/** Vertical layouts keep the top clear for the collapsed legend button. */
const VERTICAL_TOP_MARGIN = 48;
/** Room for the book bar and labels: below the axis (horizontal) or left of it (vertical). */
const HORIZONTAL_LABEL_BAND = 58;
const VERTICAL_LABEL_BAND = 64;

/** Portrait screens (phones) get a vertical axis so that the long dimension holds the Bible. */
export function computeArcLayout(width: number, height: number): ArcLayout {
  if (height > width * 1.15) {
    const baseline = VERTICAL_LABEL_BAND;
    return {
      orientation: 'vertical',
      width,
      height,
      axisStart: VERTICAL_TOP_MARGIN,
      axisEnd: height - EDGE_MARGIN,
      baseline,
      maxArcHeight: Math.max(width - baseline - EDGE_MARGIN, 0),
    };
  }
  const baseline = height - HORIZONTAL_LABEL_BAND;
  return {
    orientation: 'horizontal',
    width,
    height,
    axisStart: EDGE_MARGIN * 2,
    axisEnd: width - EDGE_MARGIN * 2,
    baseline,
    maxArcHeight: Math.max(baseline - EDGE_MARGIN, 0),
  };
}

/** Pixels per verse at the current zoom. */
export function pixelsPerVerse(layout: ArcLayout, view: AxisView): number {
  return (layout.axisEnd - layout.axisStart) / (view.end - view.start);
}

/** Along-axis pixel position of a (continuous) verse coordinate. */
export function verseToAlong(layout: ArcLayout, view: AxisView, verse: number): number {
  return layout.axisStart + (verse - view.start) * pixelsPerVerse(layout, view);
}

/** Continuous verse coordinate under an along-axis pixel position. */
export function alongToVerse(layout: ArcLayout, view: AxisView, along: number): number {
  return view.start + (along - layout.axisStart) / pixelsPerVerse(layout, view);
}

/** The along-axis coordinate of a point on the stage. */
export function alongOfPoint(
  layout: ArcLayout,
  point: { readonly x: number; readonly y: number },
): number {
  return layout.orientation === 'horizontal' ? point.x : point.y;
}
