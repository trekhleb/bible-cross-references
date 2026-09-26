/** A point in CSS pixels, relative to the element the gestures are attached to. */
export interface GesturePoint {
  readonly x: number;
  readonly y: number;
}

/** What previews a point: a hovering mouse, or a finger (or pen) resting on the screen. */
export type PreviewInput = 'mouse' | 'touch';

export interface GestureHandlers {
  /** Drag (mouse, one finger) or the movement of a pinch's center. */
  readonly onPan?: (dx: number, dy: number) => void;
  /** Wheel or pinch. `factor > 1` zooms in, around `center`. */
  readonly onZoom?: (factor: number, center: GesturePoint) => void;
  /**
   * A point is previewed, not selected: the mouse moves over the element, or a finger that was
   * held still (or put down where `previewsAt` allows) slides.
   */
  readonly onHover?: (point: GesturePoint, input: PreviewInput) => void;
  /** The preview ended: the mouse left, or the previewing finger lifted. */
  readonly onLeave?: () => void;
  /**
   * Whether a finger put down at `point` previews at once, like on an index strip, instead of
   * after a hold. Elsewhere a finger that moves at once pans.
   */
  readonly previewsAt?: (point: GesturePoint) => boolean;
  /** Click or tap without dragging. */
  readonly onTap?: (point: GesturePoint) => void;
  readonly onDoubleTap?: (point: GesturePoint) => void;
}

/** The element gestures attach to (only what they use, so tests can stand in for it). */
export type GestureElement = Pick<
  HTMLElement,
  'addEventListener' | 'removeEventListener' | 'setPointerCapture' | 'getBoundingClientRect'
>;

const TAP_SLOP_PX = 6;
const CLICK_MAX_DURATION_MS = 450;
const DOUBLE_TAP_INTERVAL_MS = 320;
const DOUBLE_TAP_SLOP_PX = 24;
/**
 * A finger held this long without moving starts a preview; lifted sooner, it taps. One moment
 * for both, so there is never a doubt: once the preview shows, lifting only ends it.
 */
export const HOLD_TO_PREVIEW_MS = 350;

/** Zoom factor for a wheel event; trackpad pinches arrive as wheel events with `ctrlKey`. */
export function wheelZoomFactor(deltaY: number, deltaMode: number, isPinch: boolean): number {
  const LINE_PX = 16;
  const PAGE_PX = 400;
  const pixels = deltaMode === 1 ? deltaY * LINE_PX : deltaMode === 2 ? deltaY * PAGE_PX : deltaY;
  return Math.exp(-pixels * (isPinch ? 0.01 : 0.002));
}

function distance(a: GesturePoint, b: GesturePoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pinchOf(pointers: ReadonlyMap<number, GesturePoint>): {
  readonly spread: number;
  readonly center: GesturePoint;
} {
  const [first, second] = [...pointers.values()];
  if (!first || !second) {
    throw new Error('A pinch needs two pointers.');
  }
  return {
    spread: Math.max(distance(first, second), 1),
    center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
  };
}

/** One pointer's press, from the moment it goes down until the last pointer lifts. */
interface Press {
  readonly start: GesturePoint;
  readonly time: number;
  /** A finger or pen, which can hold to preview; a mouse previews by hovering instead. */
  readonly touch: boolean;
  moved: boolean;
  previewing: boolean;
  hold: ReturnType<typeof setTimeout> | undefined;
}

/**
 * Unifies mouse, touch and pen input into pan / zoom / hover / tap callbacks.
 *
 * A finger pans when it moves at once, previews when held still first (then slides to scrub),
 * zooms with a second finger, and taps. The element should have `touch-action: none`. Returns a
 * function that detaches the listeners.
 */
export function attachGestures(element: GestureElement, handlers: GestureHandlers): () => void {
  const pointers = new Map<number, GesturePoint>();
  let press: Press | null = null;
  let pinch: ReturnType<typeof pinchOf> | null = null;
  let lastTap: { readonly point: GesturePoint; readonly time: number } | null = null;

  const toLocal = (event: MouseEvent): GesturePoint => {
    const rect = element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const startPreview = (current: Press, point: GesturePoint) => {
    current.previewing = true;
    handlers.onHover?.(point, 'touch');
  };

  /** Ends any pending hold and any preview of the press. */
  const stopPreview = (current: Press) => {
    clearTimeout(current.hold);
    current.hold = undefined;
    if (current.previewing) {
      current.previewing = false;
      handlers.onLeave?.();
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    element.setPointerCapture(event.pointerId);
    const point = toLocal(event);
    pointers.set(event.pointerId, point);
    if (pointers.size === 1) {
      const current: Press = {
        start: point,
        time: performance.now(),
        touch: event.pointerType !== 'mouse',
        moved: false,
        previewing: false,
        hold: undefined,
      };
      press = current;
      if (!current.touch) {
        return;
      }
      if (handlers.previewsAt?.(point)) {
        startPreview(current, point);
      } else {
        current.hold = setTimeout(() => {
          current.hold = undefined;
          const [only] = pointers.values();
          if (press === current && !current.moved && pointers.size === 1 && only) {
            startPreview(current, only);
          }
        }, HOLD_TO_PREVIEW_MS);
      }
    } else {
      // A second finger turns the gesture into a pinch; it can no longer be a tap or a preview.
      if (press) {
        press.moved = true;
        stopPreview(press);
      }
      pinch = pinchOf(pointers);
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    const point = toLocal(event);
    const previous = pointers.get(event.pointerId);
    if (!previous) {
      if (event.pointerType === 'mouse') {
        handlers.onHover?.(point, 'mouse');
      }
      return;
    }
    pointers.set(event.pointerId, point);

    if (pointers.size >= 2) {
      const next = pinchOf(pointers);
      if (pinch) {
        handlers.onZoom?.(next.spread / pinch.spread, next.center);
        handlers.onPan?.(next.center.x - pinch.center.x, next.center.y - pinch.center.y);
      }
      pinch = next;
      return;
    }
    if (!press) {
      return;
    }
    if (!press.moved && distance(point, press.start) > TAP_SLOP_PX) {
      press.moved = true;
      if (!press.previewing) {
        stopPreview(press); // It moved before the hold: a drag, which pans.
      }
    }
    if (press.previewing) {
      handlers.onHover?.(point, 'touch');
    } else if (press.moved) {
      handlers.onPan?.(point.x - previous.x, point.y - previous.y);
    }
  };

  const endPointer = (event: PointerEvent, canTap: boolean) => {
    const point = pointers.get(event.pointerId) ?? toLocal(event);
    pointers.delete(event.pointerId);
    if (pointers.size >= 2) {
      pinch = pinchOf(pointers);
      return;
    }
    pinch = null;
    if (pointers.size === 1) {
      return; // One finger lifted from a pinch; the other keeps panning.
    }
    const ended = press;
    press = null;
    if (!ended) {
      return;
    }
    stopPreview(ended);
    const maxTapMs = ended.touch ? HOLD_TO_PREVIEW_MS : CLICK_MAX_DURATION_MS;
    const isTap = canTap && !ended.moved && performance.now() - ended.time < maxTapMs;
    if (!isTap) {
      return;
    }
    const now = performance.now();
    if (
      lastTap &&
      now - lastTap.time < DOUBLE_TAP_INTERVAL_MS &&
      distance(point, lastTap.point) < DOUBLE_TAP_SLOP_PX
    ) {
      lastTap = null;
      handlers.onDoubleTap?.(point);
    } else {
      lastTap = { point, time: now };
      handlers.onTap?.(point);
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    endPointer(event, true);
  };
  const onPointerCancel = (event: PointerEvent) => {
    endPointer(event, false);
  };
  const onPointerLeave = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && pointers.size === 0) {
      handlers.onLeave?.();
    }
  };
  // Some touch screens open a context menu on a long press, which would cancel the preview.
  const onContextMenu = (event: MouseEvent) => {
    if (press?.touch) {
      event.preventDefault();
    }
  };
  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    if (!event.ctrlKey && Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      handlers.onPan?.(-event.deltaX, 0);
      return;
    }
    handlers.onZoom?.(
      wheelZoomFactor(event.deltaY, event.deltaMode, event.ctrlKey),
      toLocal(event),
    );
  };

  element.addEventListener('pointerdown', onPointerDown);
  element.addEventListener('pointermove', onPointerMove);
  element.addEventListener('pointerup', onPointerUp);
  element.addEventListener('pointercancel', onPointerCancel);
  element.addEventListener('pointerleave', onPointerLeave);
  element.addEventListener('contextmenu', onContextMenu);
  element.addEventListener('wheel', onWheel, { passive: false });
  return () => {
    if (press) {
      clearTimeout(press.hold);
    }
    element.removeEventListener('pointerdown', onPointerDown);
    element.removeEventListener('pointermove', onPointerMove);
    element.removeEventListener('pointerup', onPointerUp);
    element.removeEventListener('pointercancel', onPointerCancel);
    element.removeEventListener('pointerleave', onPointerLeave);
    element.removeEventListener('contextmenu', onContextMenu);
    element.removeEventListener('wheel', onWheel);
  };
}
