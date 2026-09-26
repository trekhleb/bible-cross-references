import { BOOKS } from '../../core/bible/books.ts';
import { getBookGenre } from '../../core/bible/genres.ts';
import type { Versification } from '../../core/bible/versification.ts';
import { elementAt } from '../../core/lib/array.ts';

/**
 * The model of the loading animation: arcs of light that grow from one verse to another along the
 * Bible's axis, land with a flash and leave a fading trace, so a dome of connections builds up
 * while the data loads. Positions are fractions of the axis: 0 is Genesis 1:1, 1 is Revelation 22:21.
 */

/** One book on the axis: where it starts, how much of the axis it takes, and its genre. */
export interface BookSegment {
  readonly start: number;
  readonly width: number;
  readonly genre: number;
}

/** The 66 books in canonical order, each as wide as its share of the verses. */
export function bookSegments(versification: Versification): readonly BookSegment[] {
  const last = versification.verseCount;
  return BOOKS.map((book) => {
    const range = versification.bookRange(book.id);
    return {
      start: range.start / last,
      width: (range.end - range.start + 1) / last,
      genre: getBookGenre(book.id).ordinal,
    };
  });
}

/** An arc of light from one verse to another. */
export interface ArcFlight {
  readonly from: number;
  readonly to: number;
  /** Genre ordinals at both ends, which color the arc (from source to target, as in Arcs). */
  readonly fromGenre: number;
  readonly toGenre: number;
  readonly launchedAt: number;
  /** Time for the light's head to reach the far end and its tail to follow, in ms. */
  readonly travel: number;
}

/** How long an arc's faint trace stays after its light has passed, in ms. */
export const TRACE_MS = 2400;
/** How long the flash where an arc lands lasts, in ms. */
const LANDING_MS = 700;
/** The head covers the arc in this share of the travel time; the tail starts after the rest. */
const HEAD_SHARE = 0.7;
/** The shortest hop, as a share of the axis, so that every arc is visibly an arc. */
const MIN_DISTANCE = 0.03;

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * Launches an arc between two random verses. Short hops are likelier than long ones, as in the
 * cross-references themselves; longer arcs take longer to travel.
 */
export function launchFlight(
  random: () => number,
  verseGenres: Uint8Array,
  now: number,
): ArcFlight {
  const from = random();
  const distance = MIN_DISTANCE + (1 - MIN_DISTANCE) * random() ** 3;
  const direction = random() < 0.5 ? 1 : -1;
  const forward = from + direction * distance;
  const to = clamp01(forward >= 0 && forward <= 1 ? forward : from - direction * distance);
  const genreAt = (position: number) =>
    elementAt(verseGenres, Math.round(position * (verseGenres.length - 1)));
  return {
    from,
    to,
    fromGenre: genreAt(from),
    toGenre: genreAt(to),
    launchedAt: now,
    travel: 1100 + 1600 * Math.abs(to - from),
  };
}

/** A moment of a flight, everything in [0, 1]. */
export interface FlightFrame {
  /** How far along the arc the light's head and tail are, from its start to its end. */
  readonly head: number;
  readonly tail: number;
  /** Brightness of the moving light. */
  readonly light: number;
  /** Brightness of the faint trace along the part of the arc already travelled. */
  readonly trace: number;
  /** Brightness of the flash where the arc lands. */
  readonly landing: number;
}

/** The flight at a given time, or `null` once it has faded out (or before it starts). */
export function flightFrame(flight: ArcFlight, now: number): FlightFrame | null {
  const elapsed = now - flight.launchedAt;
  if (elapsed < 0 || elapsed > flight.travel + TRACE_MS) {
    return null;
  }
  const progress = elapsed / flight.travel;
  const landedAt = flight.travel * HEAD_SHARE;
  return {
    head: easeInOutCubic(clamp01(progress / HEAD_SHARE)),
    tail: easeInOutCubic(clamp01((progress - (1 - HEAD_SHARE)) / HEAD_SHARE)),
    light: clamp01(progress / 0.08) * clamp01((1 - progress) / 0.15),
    trace: clamp01(1 - (elapsed - flight.travel) / TRACE_MS),
    landing: elapsed < landedAt ? 0 : clamp01(1 - (elapsed - landedAt) / LANDING_MS),
  };
}

/**
 * A point on a flight's arc at `t` (0 at its start, 1 at its end): `x` on the axis, and `y` as a
 * share of the arc's own height. The arc is half an ellipse over the axis, like the arcs in Arcs.
 */
export function arcPoint(
  flight: Pick<ArcFlight, 'from' | 'to'>,
  t: number,
): { readonly x: number; readonly y: number } {
  return {
    x: flight.from + ((flight.to - flight.from) * (1 - Math.cos(Math.PI * t))) / 2,
    y: Math.sin(Math.PI * t),
  };
}
