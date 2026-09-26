import { chapterPassageOf, versePassage, type Passage } from '../../core/bible/passage.ts';
import type { VerseIndexRange, Versification } from '../../core/bible/versification.ts';
import { attachGestures, type GesturePoint, type PreviewInput } from '../shared/gestures.ts';
import { animate, FrameScheduler, MAX_PIXEL_RATIO } from '../shared/frames.ts';
import type { ArcInstances } from './arc-instances.ts';
import {
  alongOfPoint,
  alongToVerse,
  computeArcLayout,
  pixelsPerVerse,
  type ArcLayout,
} from './arc-layout.ts';
import { ArcScene } from './arc-scene.ts';
import {
  fullView,
  interpolateView,
  panView,
  revealRange,
  zoomView,
  type AxisView,
} from './axis-view.ts';
import { paintAxis } from './axis-painter.ts';

export interface ArcHover {
  readonly passage: Passage;
  /** Pointer position in stage coordinates, for placing a tooltip. */
  readonly x: number;
  readonly y: number;
  /** A mouse, or a finger, whose tooltip must stay clear of the finger. */
  readonly input: PreviewInput;
}

/** One link shown from outside the diagram (e.g. pointed at in the details panel). */
export interface ArcPreview {
  /** The link's arc. */
  readonly links: ArcInstances;
  /** The passage it points to, marked on the axis as a whole. */
  readonly passage: VerseIndexRange;
}

export interface ArcsControllerOptions {
  /** Receives pointer, wheel and keyboard input; should be focusable. */
  readonly container: HTMLElement;
  readonly glCanvas: HTMLCanvasElement;
  readonly overlayCanvas: HTMLCanvasElement;
  readonly versification: Versification;
  readonly onHover: (hover: ArcHover | null) => void;
  readonly onSelect: (passage: Passage) => void;
  readonly onClear: () => void;
}

/** Below this many pixels per verse, pointing picks whole chapters instead of single verses. */
const VERSE_PICK_PIXELS = 4;
const KEYBOARD_PAN_SHARE = 0.15;
const KEYBOARD_ZOOM = 1.6;

/**
 * Accumulated light at which the glow saturates. The densest regions hold roughly one arc in 250
 * of the visible ones, so the ceiling follows the link count and any filter looks balanced.
 */
export function glowCeiling(arcCount: number): number {
  return Math.max(arcCount / 250, 20);
}

/** Length of the intro that grows the arcs, in ms: quick, so it never holds anyone up. */
const INTRO_MS = 800;

/**
 * A finger put down this close to the axis line, or on its labels, previews at once: the axis
 * works like an index strip. Elsewhere a finger previews after a hold, since a drag pans.
 */
const AXIS_STRIP_REACH_PX = 16;
/**
 * While a finger previews within this distance of an end of the axis, the view keeps panning that
 * way, faster the closer it gets, so a zoomed-in reader can scrub past the edge.
 */
const EDGE_PAN_ZONE_PX = 44;
/** Top edge-panning speed, in pixels per second. */
const EDGE_PAN_MAX_SPEED = 900;

/**
 * Drives the arc diagram imperatively (no React re-renders on every wheel tick): it owns the
 * WebGL scene, the 2D overlay, the visible window, and all input handling.
 */
export class ArcsController {
  readonly #options: ArcsControllerOptions;
  readonly #scene: ArcScene;
  readonly #overlay: CanvasRenderingContext2D;
  readonly #scheduler: FrameScheduler;
  readonly #detachGestures: () => void;
  #layout: ArcLayout = computeArcLayout(0, 0);
  #view: AxisView;
  #focus: VerseIndexRange | null = null;
  #hover: VerseIndexRange | null = null;
  #linkPreview: ArcPreview | null = null;
  /** Where a finger previews, while it does; drives edge panning. */
  #touchPreview: GesturePoint | null = null;
  #edgePanFrame: number | null = null;
  #edgePanTime: number | null = null;
  #linksOfRange: (range: VerseIndexRange) => ArcInstances | null = () => null;
  #cancelAnimation: (() => void) | null = null;
  /** The intro that grows the first links from their sources; runs once, when they arrive. */
  #intro: 'pending' | 'running' | 'done' = 'pending';
  #cancelIntro: (() => void) | null = null;
  /** Hidden (another view is shown), it draws nothing; the intro waits until it's shown. */
  #active = true;
  #hasLinks = false;

  constructor(options: ArcsControllerOptions) {
    this.#options = options;
    this.#scene = new ArcScene(options.glCanvas);
    const overlay = options.overlayCanvas.getContext('2d');
    if (!overlay) {
      throw new Error('Canvas 2D is not available.');
    }
    this.#overlay = overlay;
    this.#view = fullView(options.versification.verseCount);
    this.#scheduler = new FrameScheduler(() => {
      this.#draw();
    });
    this.#detachGestures = attachGestures(options.container, {
      onPan: (dx, dy) => {
        this.#panByPixels(this.#layout.orientation === 'horizontal' ? dx : dy);
      },
      onZoom: (factor, center) => {
        this.#zoomAt(factor, center);
      },
      onHover: (point, input) => {
        this.#preview(point, input);
      },
      onLeave: () => {
        this.#endPreview();
      },
      previewsAt: (point) => this.#isOnAxisStrip(point),
      onTap: (point) => {
        const passage = this.#passageAt(point);
        if (passage) {
          options.onSelect(passage);
        }
      },
      onDoubleTap: (point) => {
        this.#animateZoom(3, point);
      },
    });
    options.container.addEventListener('keydown', this.#onKeyDown);
  }

  setSize(width: number, height: number): void {
    this.#layout = computeArcLayout(width, height);
    this.#scene.setSize(width, height);
    this.#scene.setLayout(this.#layout);
    const ratio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
    const canvas = this.#options.overlayCanvas;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    this.#overlay.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.#scheduler.request();
  }

  /** All links to draw as the glowing background. The first ones grow in (see `#playIntro`). */
  setLinks(instances: ArcInstances): void {
    this.#scene.setLinks(instances, glowCeiling(instances.count));
    this.#hasLinks = instances.count > 0;
    if (this.#intro === 'pending' && this.#hasLinks && this.#active) {
      this.#playIntro();
    }
    this.#scheduler.request();
  }

  /** How to find the (filtered) links of a verse range, for focus and hover highlights. */
  setLinkResolver(resolver: (range: VerseIndexRange) => ArcInstances | null): void {
    this.#linksOfRange = resolver;
    this.#scene.setFocus(this.#focus && resolver(this.#focus));
    this.#scene.setHover(this.#hover && resolver(this.#hover));
    this.#scheduler.request();
  }

  setFocus(range: VerseIndexRange | null): void {
    const changed = range?.start !== this.#focus?.start || range?.end !== this.#focus?.end;
    this.#focus = range;
    this.#scene.setFocus(range && this.#linksOfRange(range));
    this.#scene.setDimmed(range !== null);
    if (range && changed) {
      this.#animateTo(
        revealRange(this.#view, range.start, range.end + 1, this.#options.versification.verseCount),
      );
    }
    this.#scheduler.request();
  }

  /** Shows one link and the whole passage it points to, over the focus (which stays as is). */
  setPreview(preview: ArcPreview | null): void {
    this.#linkPreview = preview;
    this.#scene.setHover(preview ? preview.links : this.#hover && this.#linksOfRange(this.#hover));
    this.#scheduler.request();
  }

  resetView(): void {
    this.#animateTo(fullView(this.#options.versification.verseCount));
  }

  dispose(): void {
    this.#cancelAnimation?.();
    this.#cancelIntro?.();
    this.#stopEdgePan();
    this.#scheduler.dispose();
    this.#detachGestures();
    this.#options.container.removeEventListener('keydown', this.#onKeyDown);
    this.#scene.dispose();
  }

  /**
   * Every arc grows from its source verse to its target while the glow fades in: the whole Bible's
   * connections unfold at once, continuing the loading screen's arcs of light. Skipped for readers
   * who prefer reduced motion.
   */
  #playIntro(): void {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.#intro = 'done';
      return;
    }
    this.#intro = 'running';
    this.#scene.setReveal(0);
    this.#cancelIntro = animate(INTRO_MS, (progress) => {
      this.#scene.setReveal(progress);
      if (progress >= 1) {
        this.#intro = 'done';
        this.#cancelIntro = null;
      }
      this.#scheduler.request();
    });
  }

  /** Shown or hidden; drawing resumes (and the intro starts) when it's shown. */
  setActive(active: boolean): void {
    this.#active = active;
    if (active) {
      if (this.#intro === 'pending' && this.#hasLinks) {
        this.#playIntro();
      }
      this.#scheduler.request();
    }
  }

  #draw(): void {
    if (!this.#active || this.#layout.width === 0 || this.#layout.height === 0) {
      return;
    }
    this.#scene.setView(this.#view);
    this.#scene.render();
    paintAxis(this.#overlay, {
      layout: this.#layout,
      view: this.#view,
      versification: this.#options.versification,
      focus: this.#focus,
      hover: this.#hover,
      passage: this.#linkPreview?.passage ?? null,
    });
  }

  #verseAt(point: GesturePoint): number | null {
    const along = alongOfPoint(this.#layout, point);
    if (along < this.#layout.axisStart || along > this.#layout.axisEnd) {
      return null;
    }
    const verse = Math.floor(alongToVerse(this.#layout, this.#view, along));
    return Math.min(Math.max(verse, 0), this.#options.versification.verseCount - 1);
  }

  #passageAt(point: GesturePoint): Passage | null {
    const verse = this.#verseAt(point);
    if (verse === null) {
      return null;
    }
    return pixelsPerVerse(this.#layout, this.#view) < VERSE_PICK_PIXELS
      ? chapterPassageOf(verse, this.#options.versification)
      : versePassage(verse);
  }

  #preview(point: GesturePoint, input: PreviewInput): void {
    this.#hoverAt(point, input);
    if (input === 'touch') {
      this.#touchPreview = point;
      this.#updateEdgePan();
    }
  }

  #endPreview(): void {
    this.#touchPreview = null;
    this.#stopEdgePan();
    this.#setHover(null);
    this.#options.onHover(null);
  }

  #hoverAt(point: GesturePoint, input: PreviewInput): void {
    // A finger past an end of the axis keeps previewing its first or last passage.
    const passage = this.#passageAt(input === 'touch' ? this.#clampToAxis(point) : point);
    this.#setHover(passage && this.#rangeOf(passage));
    this.#options.onHover(passage ? { passage, x: point.x, y: point.y, input } : null);
  }

  #clampToAxis(point: GesturePoint): GesturePoint {
    const { orientation, axisStart, axisEnd } = this.#layout;
    const clamp = (along: number) => Math.min(Math.max(along, axisStart), axisEnd - 0.5);
    return orientation === 'horizontal'
      ? { x: clamp(point.x), y: point.y }
      : { x: point.x, y: clamp(point.y) };
  }

  /** The axis line and its labels: below it when horizontal, left of it when vertical. */
  #isOnAxisStrip(point: GesturePoint): boolean {
    const { orientation, baseline } = this.#layout;
    return orientation === 'horizontal'
      ? point.y >= baseline - AXIS_STRIP_REACH_PX
      : point.x <= baseline + AXIS_STRIP_REACH_PX;
  }

  /** Signed edge-panning speed for a finger at `point`: positive pans toward later verses. */
  #edgePanSpeed(point: GesturePoint): number {
    const { axisStart, axisEnd } = this.#layout;
    const along = alongOfPoint(this.#layout, point);
    const depth = (distanceInside: number) =>
      Math.min(Math.max(1 - distanceInside / EDGE_PAN_ZONE_PX, 0), 1) ** 2;
    return EDGE_PAN_MAX_SPEED * (depth(axisEnd - along) - depth(along - axisStart));
  }

  #updateEdgePan(): void {
    const point = this.#touchPreview;
    if (point && this.#edgePanFrame === null && this.#edgePanSpeed(point) !== 0) {
      this.#edgePanFrame = requestAnimationFrame(this.#edgePanStep);
    }
  }

  readonly #edgePanStep = (time: number): void => {
    this.#edgePanFrame = null;
    const point = this.#touchPreview;
    const speed = point ? this.#edgePanSpeed(point) : 0;
    if (!point || speed === 0) {
      this.#edgePanTime = null;
      return;
    }
    const last = this.#edgePanTime ?? time;
    const before = this.#view;
    // Capped, so a stalled frame never jumps the view.
    this.#panByPixels((-speed * Math.min(time - last, 50)) / 1000);
    this.#hoverAt(point, 'touch');
    if (time !== last && this.#view.start === before.start) {
      this.#edgePanTime = null; // Reached the end of the Bible: nothing left to pan to.
      return;
    }
    this.#edgePanTime = time;
    this.#edgePanFrame = requestAnimationFrame(this.#edgePanStep);
  };

  #stopEdgePan(): void {
    if (this.#edgePanFrame !== null) {
      cancelAnimationFrame(this.#edgePanFrame);
    }
    this.#edgePanFrame = null;
    this.#edgePanTime = null;
  }

  #setHover(range: VerseIndexRange | null): void {
    if (range?.start === this.#hover?.start && range?.end === this.#hover?.end) {
      return;
    }
    this.#hover = range;
    this.#scene.setHover(range && this.#linksOfRange(range));
    this.#scheduler.request();
  }

  #rangeOf(passage: Passage): VerseIndexRange {
    if (passage.kind === 'verse') {
      return { start: passage.verse, end: passage.verse };
    }
    const range = this.#options.versification.chapterRange(passage.book, passage.chapter);
    return range ?? { start: 0, end: 0 };
  }

  #panByPixels(deltaAlong: number): void {
    this.#cancelAnimation?.();
    const deltaVerses = -deltaAlong / pixelsPerVerse(this.#layout, this.#view);
    this.#view = panView(this.#view, deltaVerses, this.#options.versification.verseCount);
    this.#scheduler.request();
  }

  #zoomAt(factor: number, point: GesturePoint): void {
    this.#cancelAnimation?.();
    const anchor = alongToVerse(this.#layout, this.#view, alongOfPoint(this.#layout, point));
    this.#view = zoomView(this.#view, factor, anchor, this.#options.versification.verseCount);
    this.#scheduler.request();
  }

  #animateZoom(factor: number, point: GesturePoint): void {
    const anchor = alongToVerse(this.#layout, this.#view, alongOfPoint(this.#layout, point));
    this.#animateTo(zoomView(this.#view, factor, anchor, this.#options.versification.verseCount));
  }

  #animateTo(target: AxisView): void {
    this.#cancelAnimation?.();
    const from = this.#view;
    this.#cancelAnimation = animate(450, (progress) => {
      this.#view = interpolateView(from, target, progress);
      this.#scheduler.request();
    });
  }

  readonly #onKeyDown = (event: KeyboardEvent): void => {
    const total = this.#options.versification.verseCount;
    const span = this.#view.end - this.#view.start;
    const center: GesturePoint = { x: this.#layout.width / 2, y: this.#layout.height / 2 };
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        this.#animateTo(panView(this.#view, -span * KEYBOARD_PAN_SHARE, total));
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        this.#animateTo(panView(this.#view, span * KEYBOARD_PAN_SHARE, total));
        break;
      case '+':
      case '=':
        this.#animateZoom(KEYBOARD_ZOOM, center);
        break;
      case '-':
      case '_':
        this.#animateZoom(1 / KEYBOARD_ZOOM, center);
        break;
      case '0':
        this.resetView();
        break;
      case 'Escape':
        this.#options.onClear();
        break;
      default:
        return;
    }
    event.preventDefault();
  };
}
