import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  attachGestures,
  HOLD_TO_PREVIEW_MS,
  wheelZoomFactor,
  type GestureElement,
  type GestureHandlers,
} from './gestures.ts';

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

/** A stand-in for the element: it dispatches events and sits at the page's origin. */
class Surface extends EventTarget implements GestureElement {
  setPointerCapture(): void {
    // Nothing to capture: every event is dispatched to this surface directly.
  }

  getBoundingClientRect(): DOMRect {
    return {
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 400,
      bottom: 400,
      width: 400,
      height: 400,
      toJSON: () => ({}),
    };
  }
}

describe('attachGestures, with a finger', () => {
  const createHandlers = () => ({
    onPan: vi.fn<NonNullable<GestureHandlers['onPan']>>(),
    onZoom: vi.fn<NonNullable<GestureHandlers['onZoom']>>(),
    onHover: vi.fn<NonNullable<GestureHandlers['onHover']>>(),
    onLeave: vi.fn<NonNullable<GestureHandlers['onLeave']>>(),
    previewsAt: vi.fn<NonNullable<GestureHandlers['previewsAt']>>(() => false),
    onTap: vi.fn<NonNullable<GestureHandlers['onTap']>>(),
    onDoubleTap: vi.fn<NonNullable<GestureHandlers['onDoubleTap']>>(),
  });
  let surface: Surface;
  let handlers: ReturnType<typeof createHandlers>;
  let detach: () => void;

  const send = (type: string, id: number, x: number, y: number, pointerType = 'touch') => {
    const event = Object.assign(new Event(type, { cancelable: true }), {
      pointerId: id,
      pointerType,
      clientX: x,
      clientY: y,
      button: 0,
    });
    surface.dispatchEvent(event);
    return event;
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    surface = new Surface();
    handlers = createHandlers();
    detach = attachGestures(surface, handlers);
  });

  afterEach(() => {
    detach();
    vi.useRealTimers();
  });

  it('previews after a hold, scrubs as the finger slides, and ends without selecting', () => {
    send('pointerdown', 1, 100, 100);
    vi.advanceTimersByTime(HOLD_TO_PREVIEW_MS - 1);
    expect(handlers.onHover).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(handlers.onHover).toHaveBeenLastCalledWith({ x: 100, y: 100 }, 'touch');

    send('pointermove', 1, 100, 160);
    expect(handlers.onHover).toHaveBeenLastCalledWith({ x: 100, y: 160 }, 'touch');
    expect(handlers.onPan).not.toHaveBeenCalled();

    send('pointerup', 1, 100, 160);
    expect(handlers.onLeave).toHaveBeenCalledOnce();
    expect(handlers.onTap).not.toHaveBeenCalled();
  });

  it('pans when the finger moves before the hold, and never previews then', () => {
    send('pointerdown', 1, 100, 100);
    send('pointermove', 1, 100, 120);
    vi.advanceTimersByTime(HOLD_TO_PREVIEW_MS * 2);
    send('pointermove', 1, 100, 130);
    send('pointerup', 1, 100, 130);
    expect(handlers.onPan).toHaveBeenCalledTimes(2);
    expect(handlers.onHover).not.toHaveBeenCalled();
    expect(handlers.onLeave).not.toHaveBeenCalled();
    expect(handlers.onTap).not.toHaveBeenCalled();
  });

  it('taps when lifted before the hold; once the preview shows, lifting only ends it', () => {
    send('pointerdown', 1, 50, 50);
    vi.advanceTimersByTime(HOLD_TO_PREVIEW_MS - 1);
    send('pointerup', 1, 50, 50);
    expect(handlers.onHover).not.toHaveBeenCalled();
    expect(handlers.onTap).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(1000); // Well apart, so the next one is not a double tap.
    send('pointerdown', 1, 50, 50);
    vi.advanceTimersByTime(HOLD_TO_PREVIEW_MS);
    send('pointerup', 1, 50, 50);
    expect(handlers.onHover).toHaveBeenCalledOnce();
    expect(handlers.onLeave).toHaveBeenCalledOnce();
    expect(handlers.onTap).toHaveBeenCalledOnce();
  });

  it('taps where a finger previews at once, when it lifts quickly without moving', () => {
    handlers.previewsAt.mockReturnValue(true);
    send('pointerdown', 1, 10, 300);
    vi.advanceTimersByTime(100);
    send('pointerup', 1, 10, 300);
    expect(handlers.onHover).toHaveBeenCalledOnce();
    expect(handlers.onLeave).toHaveBeenCalledOnce();
    expect(handlers.onTap).toHaveBeenCalledOnce();
  });

  it('only previews, without selecting, when held long', () => {
    send('pointerdown', 1, 50, 50);
    vi.advanceTimersByTime(1000);
    send('pointerup', 1, 50, 50);
    expect(handlers.onLeave).toHaveBeenCalledOnce();
    expect(handlers.onTap).not.toHaveBeenCalled();
  });

  it('previews at once where `previewsAt` allows', () => {
    handlers.previewsAt.mockReturnValue(true);
    send('pointerdown', 1, 10, 300);
    expect(handlers.onHover).toHaveBeenCalledWith({ x: 10, y: 300 }, 'touch');
    send('pointermove', 1, 10, 200);
    expect(handlers.onHover).toHaveBeenLastCalledWith({ x: 10, y: 200 }, 'touch');
    expect(handlers.onPan).not.toHaveBeenCalled();
  });

  it('turns into a pinch when a second finger lands, ending any preview', () => {
    send('pointerdown', 1, 100, 100);
    vi.advanceTimersByTime(HOLD_TO_PREVIEW_MS);
    expect(handlers.onHover).toHaveBeenCalledOnce();

    send('pointerdown', 2, 200, 100);
    expect(handlers.onLeave).toHaveBeenCalledOnce();
    send('pointermove', 2, 300, 100);
    expect(handlers.onZoom).toHaveBeenCalledOnce();
    expect(handlers.onZoom.mock.calls[0]?.[0]).toBeCloseTo(2);

    send('pointerup', 2, 300, 100);
    send('pointerup', 1, 100, 100);
    expect(handlers.onHover).toHaveBeenCalledOnce();
    expect(handlers.onTap).not.toHaveBeenCalled();
  });

  it('keeps a pending hold from previewing once a pinch has started', () => {
    send('pointerdown', 1, 100, 100);
    send('pointerdown', 2, 200, 100);
    vi.advanceTimersByTime(HOLD_TO_PREVIEW_MS * 2);
    expect(handlers.onHover).not.toHaveBeenCalled();
  });

  it('keeps the mouse to hovering: holding its button never previews', () => {
    send('pointermove', 1, 20, 20, 'mouse');
    expect(handlers.onHover).toHaveBeenLastCalledWith({ x: 20, y: 20 }, 'mouse');
    send('pointerdown', 1, 20, 20, 'mouse');
    vi.advanceTimersByTime(1000);
    send('pointermove', 1, 60, 20, 'mouse');
    expect(handlers.onHover).toHaveBeenCalledOnce();
    expect(handlers.onPan).toHaveBeenCalledOnce();
  });

  it("stops a finger's long press from opening the context menu, but not a right click", () => {
    send('pointerdown', 1, 20, 20);
    const touchMenu = new Event('contextmenu', { cancelable: true });
    surface.dispatchEvent(touchMenu);
    expect(touchMenu.defaultPrevented).toBe(true);
    send('pointerup', 1, 20, 20);

    const mouseMenu = new Event('contextmenu', { cancelable: true });
    surface.dispatchEvent(mouseMenu);
    expect(mouseMenu.defaultPrevented).toBe(false);
  });
});
