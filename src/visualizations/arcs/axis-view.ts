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

/**
 * The window a step arrived at, or the one it started from if the step did not arrive anywhere.
 *
 * Every step below is arithmetic on pointer positions, wheel deltas and the stage's size, and a
 * NaN or an infinity anywhere in it used to become the window itself. Nothing ever recovered
 * from that: the arcs, the book bar and its labels vanished, and the next hover took the whole
 * view down looking up verse NaN. A Firefox reader reached it with the mouse wheel, by a route
 * that was never found, so the guard sits here, where every route ends: whatever went wrong, the
 * step is dropped and the window stays where it was.
 */
function finiteOr(next: AxisView, previous: AxisView): AxisView {
  return Number.isFinite(next.start) && Number.isFinite(next.end) ? next : previous;
}

/** Zooms by `factor` (> 1 zooms in) keeping the verse at `anchor` under the pointer. */
export function zoomView(view: AxisView, factor: number, anchor: number, total: number): AxisView {
  const span = view.end - view.start;
  const nextSpan = Math.min(Math.max(span / factor, MIN_VIEW_SPAN), total);
  const anchorShare = span > 0 ? (anchor - view.start) / span : 0.5;
  const start = anchor - anchorShare * nextSpan;
  return finiteOr(clampView({ start, end: start + nextSpan }, total), view);
}

export function panView(view: AxisView, deltaVerses: number, total: number): AxisView {
  return finiteOr(
    clampView({ start: view.start + deltaVerses, end: view.end + deltaVerses }, total),
    view,
  );
}

/** Moves the window (keeping its span) so that `[start, end]` is visible, centered if needed. */
export function revealRange(view: AxisView, start: number, end: number, total: number): AxisView {
  if (start >= view.start && end <= view.end) {
    return view;
  }
  const span = view.end - view.start;
  const center = (start + end) / 2;
  return finiteOr(clampView({ start: center - span / 2, end: center + span / 2 }, total), view);
}

/** Linear interpolation between two views, for animations. */
export function interpolateView(from: AxisView, to: AxisView, progress: number): AxisView {
  return finiteOr(
    {
      start: from.start + (to.start - from.start) * progress,
      end: from.end + (to.end - from.end) * progress,
    },
    from,
  );
}
