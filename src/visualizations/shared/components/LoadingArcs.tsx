import { useEffect, useRef } from 'react';
import { CANONICAL_VERSIFICATION } from '../../../core/bible/versification.ts';
import {
  arcPoint,
  bookSegments,
  flightFrame,
  launchFlight,
  type ArcFlight,
  type BookSegment,
  type FlightFrame,
} from '../loading-arcs.ts';
import { GENRE_HEX, GENRE_RGB, type Rgb } from '../palette.ts';
import { MAX_PIXEL_RATIO } from '../frames.ts';
import { computeVerseGenres } from '../verse-genres.ts';
import styles from './LoadingArcs.module.css';

interface LoadingArcsProps {
  /** What is loading: the status line under the animation, also read by screen readers. */
  readonly label: string;
}

/** At most this many arcs at once, counting the fading traces. */
const MAX_FLIGHTS = 28;
/** A new arc takes off after a random pause in this range, in ms. */
const LAUNCH_PAUSE_MS = { min: 70, max: 220 };
/** Thickness of the axis, in CSS pixels. */
const AXIS_THICKNESS = 3;
/** Pieces of the moving light, brighter toward its head. */
const LIGHT_PIECES = 10;

interface Layout {
  readonly width: number;
  readonly height: number;
  /** Where the axis starts and how wide it is; arcs rise from it up to `maxHeight`. */
  readonly left: number;
  readonly axisWidth: number;
  readonly axisY: number;
  readonly maxHeight: number;
}

type Point = readonly [x: number, y: number];

const rgba = ([red, green, blue]: Rgb, alpha: number) =>
  `rgb(${String(Math.round(red * 255))} ${String(Math.round(green * 255))} ${String(Math.round(blue * 255))} / ${String(alpha)})`;

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const genreHex = (genre: number) => GENRE_HEX[genre] ?? '#ffffff';
const genreRgb = (genre: number): Rgb => GENRE_RGB[genre] ?? [1, 1, 1];

/** Strokes the part of an arc between `from` and `to` (0–1 along it). */
function strokeArc(
  context: CanvasRenderingContext2D,
  pointAt: (t: number) => Point,
  from: number,
  to: number,
  width: number,
  alpha: number,
): void {
  const steps = Math.max(2, Math.ceil((to - from) * 64));
  context.beginPath();
  for (let step = 0; step <= steps; step += 1) {
    const [x, y] = pointAt(from + ((to - from) * step) / steps);
    if (step === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.lineWidth = width;
  context.globalAlpha = alpha;
  context.stroke();
}

/** A soft round glow, white at its heart. */
function glow(
  context: CanvasRenderingContext2D,
  [x, y]: Point,
  radius: number,
  color: Rgb,
  intensity: number,
): void {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgb(255 255 255 / ${String(0.9 * intensity)})`);
  gradient.addColorStop(0.25, rgba(color, 0.55 * intensity));
  gradient.addColorStop(1, rgba(color, 0));
  context.globalAlpha = 1;
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

function paintFlight(
  context: CanvasRenderingContext2D,
  layout: Layout,
  flight: ArcFlight,
  frame: FlightFrame,
): void {
  const fromX = layout.left + flight.from * layout.axisWidth;
  const toX = layout.left + flight.to * layout.axisWidth;
  const height = Math.min(Math.abs(toX - fromX) / 2, layout.maxHeight);
  const pointAt = (t: number): Point => {
    const { x, y } = arcPoint(flight, t);
    return [layout.left + x * layout.axisWidth, layout.axisY - y * height];
  };
  // Colored from the source genre to the target genre, as in Arcs.
  const gradient = context.createLinearGradient(fromX, 0, toX, 0);
  gradient.addColorStop(0, genreHex(flight.fromGenre));
  gradient.addColorStop(1, genreHex(flight.toGenre));
  context.strokeStyle = gradient;

  if (frame.trace > 0 && frame.head > 0) {
    strokeArc(context, pointAt, 0, frame.head, 1.2, 0.16 * frame.trace);
  }
  if (frame.light > 0 && frame.head > frame.tail) {
    for (let piece = 0; piece < LIGHT_PIECES; piece += 1) {
      const from = frame.tail + ((frame.head - frame.tail) * piece) / LIGHT_PIECES;
      const to = frame.tail + ((frame.head - frame.tail) * (piece + 1)) / LIGHT_PIECES;
      const intensity = frame.light * ((piece + 1) / LIGHT_PIECES) ** 1.6;
      strokeArc(context, pointAt, from, to, 9, 0.05 * intensity);
      strokeArc(context, pointAt, from, to, 3.5, 0.2 * intensity);
      strokeArc(context, pointAt, from, to, 1.4, 0.9 * intensity);
    }
    const headColor = mix(genreRgb(flight.fromGenre), genreRgb(flight.toGenre), frame.head);
    glow(context, pointAt(frame.head), 10, headColor, frame.light);
  }
  if (frame.landing > 0) {
    glow(context, [toX, layout.axisY], 24, genreRgb(flight.toGenre), frame.landing);
  }
}

function paint(
  context: CanvasRenderingContext2D,
  layout: Layout,
  books: readonly BookSegment[],
  flights: readonly (readonly [ArcFlight, FlightFrame])[],
): void {
  context.clearRect(0, 0, layout.width, layout.height);
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 0.9;
  for (const book of books) {
    const width = book.width * layout.axisWidth;
    context.fillStyle = genreHex(book.genre);
    context.fillRect(
      layout.left + book.start * layout.axisWidth,
      layout.axisY,
      width > 3 ? width - 1 : width,
      AXIS_THICKNESS,
    );
  }
  // Additive light: where arcs cross they brighten, like the glow of the Arcs view.
  context.globalCompositeOperation = 'lighter';
  context.lineCap = 'round';
  for (const [flight, frame] of flights) {
    paintFlight(context, layout, flight, frame);
  }
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 1;
}

/**
 * The loading screen, a preview of the Arcs view: over the Bible's axis (its 66 books colored by
 * genre), arcs of light grow from verse to verse, land with a flash and leave a fading trace.
 * Readers who prefer reduced motion see a still frame.
 */
export function LoadingArcs({ label }: LoadingArcsProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!stage || !canvas || !context) {
      return undefined;
    }
    const books = bookSegments(CANONICAL_VERSIFICATION);
    const verseGenres = computeVerseGenres(CANONICAL_VERSIFICATION);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // The canvas bleeds past the stage (see the CSS), so glows near its edges are not clipped.
    const measure = (): Layout => {
      const stageBox = stage.getBoundingClientRect();
      const canvasBox = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
      canvas.width = Math.round(canvasBox.width * ratio);
      canvas.height = Math.round(canvasBox.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const top = stageBox.top - canvasBox.top;
      return {
        width: canvasBox.width,
        height: canvasBox.height,
        left: stageBox.left - canvasBox.left,
        axisWidth: stageBox.width,
        axisY: top + stageBox.height - AXIS_THICKNESS,
        maxHeight: stageBox.height - AXIS_THICKNESS - 8,
      };
    };

    // A still frame: the traces of a few arcs.
    const stillFrame = (): (readonly [ArcFlight, FlightFrame])[] =>
      Array.from({ length: 12 }, () => [
        launchFlight(Math.random, verseGenres, 0),
        { head: 1, tail: 1, light: 0, trace: 1, landing: 0 },
      ]);
    const still = reducedMotion ? stillFrame() : [];

    let layout = measure();
    const flights: ArcFlight[] = [];
    let nextLaunch = 0;
    let frameRequest = 0;
    const tick = (now: number) => {
      if (flights.length === 0) {
        // Start with a few arcs already under way, so the very first frames are not empty.
        flights.push(
          ...[900, 450, 0].map((offset) => launchFlight(Math.random, verseGenres, now - offset)),
        );
      }
      if (now >= nextLaunch && flights.length < MAX_FLIGHTS) {
        flights.push(launchFlight(Math.random, verseGenres, now));
        nextLaunch =
          now + LAUNCH_PAUSE_MS.min + Math.random() * (LAUNCH_PAUSE_MS.max - LAUNCH_PAUSE_MS.min);
      }
      const frames: (readonly [ArcFlight, FlightFrame])[] = [];
      for (let index = flights.length - 1; index >= 0; index -= 1) {
        const flight = flights[index];
        const frame = flight && flightFrame(flight, now);
        if (flight && frame) frames.push([flight, frame]);
        else flights.splice(index, 1);
      }
      paint(context, layout, books, frames);
      frameRequest = requestAnimationFrame(tick);
    };

    const observer = new ResizeObserver(() => {
      layout = measure();
      if (reducedMotion) paint(context, layout, books, still);
    });
    observer.observe(stage);
    if (reducedMotion) paint(context, layout, books, still);
    else frameRequest = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameRequest);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={styles.loader}>
      <div ref={stageRef} className={styles.stage}>
        <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      </div>
      <p role="status" className={styles.label}>
        {label}
      </p>
    </div>
  );
}
