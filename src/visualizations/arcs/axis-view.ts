/**
 * The visible window of the verse axis, in continuous verse-index units: verse `v` occupies
 * `[v, v + 1)`. Zooming and panning always keep the window inside `[0, total]`.
 */
export interface AxisView {
  readonly start: number;
  readonly end: number;
}

/** The narrowest window, in verses, so that single verses stay comfortably wide. */
export const MIN_VIEW_SPAN = 24;

export function fullView(total: number): AxisView {
  return { start: 0, end: total };
}

export function clampView(view: AxisView, total: number, minSpan = MIN_VIEW_SPAN): AxisView {
  const span = Math.min(Math.max(view.end - view.start, Math.min(minSpan, total)), total);
  const start = Math.min(Math.max(view.start, 0), total - span);
  return { start, end: start + span };
}

/** Zooms by `factor` (> 1 zooms in) keeping the verse at `anchor` under the pointer. */
export function zoomView(view: AxisView, factor: number, anchor: number, total: number): AxisView {
  const span = view.end - view.start;
  const nextSpan = Math.min(Math.max(span / factor, MIN_VIEW_SPAN), total);
  const anchorShare = span > 0 ? (anchor - view.start) / span : 0.5;
  const start = anchor - anchorShare * nextSpan;
  return clampView({ start, end: start + nextSpan }, total);
}

export function panView(view: AxisView, deltaVerses: number, total: number): AxisView {
  return clampView({ start: view.start + deltaVerses, end: view.end + deltaVerses }, total);
}

/** Moves the window (keeping its span) so that `[start, end]` is visible, centered if needed. */
export function revealRange(view: AxisView, start: number, end: number, total: number): AxisView {
  if (start >= view.start && end <= view.end) {
    return view;
  }
  const span = view.end - view.start;
  const center = (start + end) / 2;
  return clampView({ start: center - span / 2, end: center + span / 2 }, total);
}

/** Linear interpolation between two views, for animations. */
export function interpolateView(from: AxisView, to: AxisView, progress: number): AxisView {
  return {
    start: from.start + (to.start - from.start) * progress,
    end: from.end + (to.end - from.end) * progress,
  };
}
