/** A point in CSS pixels, relative to the element the gestures are attached to. */
export interface GesturePoint {
  readonly x: number;
  readonly y: number;
}

export interface GestureHandlers {
  /** Drag (mouse, one finger) or the movement of a pinch's center. */
  readonly onPan?: (dx: number, dy: number) => void;
  /** Wheel or pinch. `factor > 1` zooms in, around `center`. */
  readonly onZoom?: (factor: number, center: GesturePoint) => void;
  /** Mouse movement without a pressed button. */
  readonly onHover?: (point: GesturePoint) => void;
  readonly onLeave?: () => void;
  /** Click or tap without dragging. */
  readonly onTap?: (point: GesturePoint) => void;
  readonly onDoubleTap?: (point: GesturePoint) => void;
}

const TAP_SLOP_PX = 6;
const TAP_MAX_DURATION_MS = 450;
const DOUBLE_TAP_INTERVAL_MS = 320;
const DOUBLE_TAP_SLOP_PX = 24;

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

/**
 * Unifies mouse, touch and pen input into pan / zoom / hover / tap callbacks.
 * The element should have `touch-action: none`. Returns a function that detaches the listeners.
 */
export function attachGestures(element: HTMLElement, handlers: GestureHandlers): () => void {
  const pointers = new Map<number, GesturePoint>();
  let press: { readonly start: GesturePoint; readonly time: number; moved: boolean } | null = null;
  let pinch: ReturnType<typeof pinchOf> | null = null;
  let lastTap: { readonly point: GesturePoint; readonly time: number } | null = null;

  const toLocal = (event: MouseEvent): GesturePoint => {
    const rect = element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }
    element.setPointerCapture(event.pointerId);
    const point = toLocal(event);
    pointers.set(event.pointerId, point);
    if (pointers.size === 1) {
      press = { start: point, time: performance.now(), moved: false };
    } else {
      // A second finger turns the gesture into a pinch; it can no longer be a tap.
      if (press) {
        press.moved = true;
      }
      pinch = pinchOf(pointers);
    }
  };

  const onPointerMove = (event: PointerEvent) => {
    const point = toLocal(event);
    const previous = pointers.get(event.pointerId);
    if (!previous) {
      if (event.pointerType === 'mouse') {
        handlers.onHover?.(point);
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
    if (press && !press.moved && distance(point, press.start) > TAP_SLOP_PX) {
      press.moved = true;
    }
    if (press?.moved) {
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
    const isTap =
      canTap &&
      press !== null &&
      !press.moved &&
      performance.now() - press.time < TAP_MAX_DURATION_MS;
    press = null;
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
  element.addEventListener('wheel', onWheel, { passive: false });
  return () => {
    element.removeEventListener('pointerdown', onPointerDown);
    element.removeEventListener('pointermove', onPointerMove);
    element.removeEventListener('pointerup', onPointerUp);
    element.removeEventListener('pointercancel', onPointerCancel);
    element.removeEventListener('pointerleave', onPointerLeave);
    element.removeEventListener('wheel', onWheel);
  };
}
