import { describe, expect, it } from 'vitest';
import { KJV_VERSIFICATION as kjv } from '../../core/bible/versification.ts';
import {
  arcPoint,
  bookSegments,
  flightFrame,
  launchFlight,
  TRACE_MS,
  type ArcFlight,
} from './loading-arcs.ts';
import { computeVerseGenres } from './verse-genres.ts';

/** A small deterministic generator (mulberry32), so the tests are repeatable. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const verseGenres = computeVerseGenres(kjv);

describe('bookSegments', () => {
  it('lays the 66 books end to end across the whole axis', () => {
    const segments = bookSegments(kjv);
    expect(segments).toHaveLength(66);
    expect(segments[0]?.start).toBe(0);
    const last = segments.at(-1);
    expect((last?.start ?? 0) + (last?.width ?? 0)).toBeCloseTo(1, 10);
    segments.slice(1).forEach((segment, index) => {
      const previous = segments[index];
      expect(segment.start).toBeCloseTo((previous?.start ?? 0) + (previous?.width ?? 0), 10);
    });
  });

  it('colors Genesis as Law and Revelation as Revelation', () => {
    const segments = bookSegments(kjv);
    expect(segments[0]?.genre).toBe(0);
    expect(segments.at(-1)?.genre).toBe(9);
  });
});

describe('launchFlight', () => {
  it('keeps both ends on the axis, a visible distance apart, with their genres', () => {
    const random = seeded(7);
    for (let i = 0; i < 2000; i += 1) {
      const flight = launchFlight(random, verseGenres, 0);
      expect(flight.from).toBeGreaterThanOrEqual(0);
      expect(flight.from).toBeLessThanOrEqual(1);
      expect(flight.to).toBeGreaterThanOrEqual(0);
      expect(flight.to).toBeLessThanOrEqual(1);
      expect(Math.abs(flight.to - flight.from)).toBeGreaterThanOrEqual(0.03 - 1e-9);
      expect(flight.fromGenre).toBeGreaterThanOrEqual(0);
      expect(flight.toGenre).toBeLessThanOrEqual(9);
    }
  });

  it('prefers short hops, as the cross-references do', () => {
    const random = seeded(11);
    const distances = Array.from({ length: 2000 }, () => {
      const flight = launchFlight(random, verseGenres, 0);
      return Math.abs(flight.to - flight.from);
    });
    const short = distances.filter((distance) => distance < 0.25).length;
    expect(short / distances.length).toBeGreaterThan(0.5);
  });
});

describe('flightFrame', () => {
  const flight: ArcFlight = {
    from: 0.2,
    to: 0.6,
    fromGenre: 0,
    toGenre: 5,
    launchedAt: 1000,
    travel: 2000,
  };

  it('grows from the start: the head leads and the tail follows', () => {
    const start = flightFrame(flight, 1000);
    expect(start?.head).toBe(0);
    expect(start?.tail).toBe(0);
    const middle = flightFrame(flight, 2000);
    expect(middle?.head).toBeGreaterThan(middle?.tail ?? 1);
  });

  it('lands with a flash once the head reaches the end', () => {
    expect(flightFrame(flight, 2300)?.landing).toBe(0);
    const landed = flightFrame(flight, 1000 + 2000 * 0.7);
    expect(landed?.head).toBe(1);
    expect(landed?.landing).toBe(1);
  });

  it('leaves a trace that fades after the light has passed, then ends', () => {
    const passed = flightFrame(flight, 3000);
    expect(passed?.tail).toBe(1);
    expect(passed?.light).toBe(0);
    expect(passed?.trace).toBe(1);
    expect(flightFrame(flight, 3000 + TRACE_MS / 2)?.trace).toBeCloseTo(0.5, 5);
    expect(flightFrame(flight, 3000 + TRACE_MS + 1)).toBeNull();
    expect(flightFrame(flight, 999)).toBeNull();
  });
});

describe('arcPoint', () => {
  it('rises from one end to the other over the middle', () => {
    expect(arcPoint(flight(0.2, 0.6), 0)).toEqual({ x: 0.2, y: 0 });
    expect(arcPoint(flight(0.2, 0.6), 0.5).x).toBeCloseTo(0.4, 10);
    expect(arcPoint(flight(0.2, 0.6), 0.5).y).toBeCloseTo(1, 10);
    expect(arcPoint(flight(0.6, 0.2), 1).x).toBeCloseTo(0.2, 10);
  });
});

function flight(from: number, to: number) {
  return { from, to };
}
