import { BOOKS } from '../../core/bible/books.ts';
import { GENRES, getBookGenre, getGenreBooks } from '../../core/bible/genres.ts';
import type { VerseIndexRange, Versification } from '../../core/bible/versification.ts';
import { elementAt } from '../../core/lib/array.ts';
import { GENRE_HEX } from '../shared/palette.ts';
import { verseToAlong, type ArcLayout } from './arc-layout.ts';
import type { AxisView } from './axis-view.ts';

export interface AxisPaint {
  readonly layout: ArcLayout;
  readonly view: AxisView;
  readonly versification: Versification;
  readonly focus: VerseIndexRange | null;
  readonly hover: VerseIndexRange | null;
  /** A passage a previewed link points to: a band quieter than hover's, under the focus. */
  readonly passage: VerseIndexRange | null;
}

const TEXT = '#ecebe6';
const MUTED = '#9a9890';
const AXIS = '#3a3935';
const BAR_OFFSET = 3;
const BAR_THICKNESS = 8;
const LABEL_FONT = '11px system-ui, -apple-system, "Segoe UI", sans-serif';
const GENRE_FONT = '600 10px system-ui, -apple-system, "Segoe UI", sans-serif';

/**
 * Fills a rectangle given in along/across coordinates. "Across" values grow away from the arcs:
 * downward when the axis is horizontal, leftward (mirrored around the axis) when it is vertical.
 */
function fillAlong(
  context: CanvasRenderingContext2D,
  layout: ArcLayout,
  alongFrom: number,
  alongTo: number,
  acrossFrom: number,
  acrossTo: number,
): void {
  if (layout.orientation === 'horizontal') {
    context.fillRect(alongFrom, acrossFrom, alongTo - alongFrom, acrossTo - acrossFrom);
    return;
  }
  const mirroredLeft = 2 * layout.baseline - acrossTo;
  context.fillRect(mirroredLeft, alongFrom, acrossTo - acrossFrom, alongTo - alongFrom);
}

/**
 * Paints the axis overlay: genre-colored book bars, chapter ticks, labels that fit, the hover and
 * focus markers, and an overview strip with the visible window when zoomed in.
 */
export function paintAxis(context: CanvasRenderingContext2D, paint: AxisPaint): void {
  const { layout, view, versification } = paint;
  context.clearRect(0, 0, layout.width, layout.height);
  const along = (verse: number) => verseToAlong(layout, view, verse);
  const visible = (from: number, to: number) => to >= layout.axisStart && from <= layout.axisEnd;
  const clampAlong = (value: number) => Math.min(Math.max(value, layout.axisStart), layout.axisEnd);
  const barFrom = layout.baseline + BAR_OFFSET;
  const barTo = barFrom + BAR_THICKNESS;

  // Axis line.
  context.fillStyle = AXIS;
  fillAlong(
    context,
    layout,
    layout.axisStart,
    layout.axisEnd,
    layout.baseline,
    layout.baseline + 1,
  );

  // Book bars; alternate books of a genre are dimmer so neighbors stay distinguishable.
  for (const book of BOOKS) {
    const range = versification.bookRange(book.id);
    const from = along(range.start);
    const to = along(range.end + 1);
    if (!visible(from, to)) continue;
    const gap = to - from > 4 ? 1 : 0;
    context.globalAlpha = book.ordinal % 2 === 0 ? 1 : 0.72;
    context.fillStyle = elementAt(GENRE_HEX, getBookGenre(book.id).ordinal);
    fillAlong(context, layout, clampAlong(from) + gap, clampAlong(to) - gap, barFrom, barTo);
  }
  context.globalAlpha = 1;

  // Chapter ticks once chapters are wide enough to tell apart.
  const chapterPixels = ((layout.axisEnd - layout.axisStart) / (view.end - view.start)) * 26;
  if (chapterPixels > 10) {
    context.fillStyle = MUTED;
    for (const book of BOOKS) {
      for (let chapter = 1; chapter <= versification.chapterCountOf(book.id); chapter += 1) {
        const start = versification.chapterRange(book.id, chapter)?.start ?? 0;
        const position = along(start);
        if (position >= layout.axisStart && position <= layout.axisEnd) {
          fillAlong(context, layout, position, position + 1, barTo + 1, barTo + 4);
        }
      }
    }
  }

  const highlight = (range: VerseIndexRange | null, color: string, width: number) => {
    if (!range) return;
    const from = along(range.start);
    const to = along(range.end + 1);
    if (!visible(from, to)) return;
    context.fillStyle = color;
    const center = (clampAlong(from) + clampAlong(to)) / 2;
    const half = Math.max((clampAlong(to) - clampAlong(from)) / 2, width);
    fillAlong(context, layout, center - half, center + half, barFrom - 2, barTo + 2);
  };
  highlight(paint.passage, 'rgb(236 235 230 / 0.3)', 1.5);
  highlight(paint.hover, 'rgb(236 235 230 / 0.45)', 1.5);
  highlight(paint.focus, TEXT, 2);

  paintBookLabels(context, paint, along);
  if (layout.orientation === 'horizontal') {
    paintGenreLabels(context, paint, along);
  }
  paintOverview(context, paint);
}

function paintBookLabels(
  context: CanvasRenderingContext2D,
  { layout, versification, focus, hover, passage }: AxisPaint,
  along: (verse: number) => number,
): void {
  const horizontal = layout.orientation === 'horizontal';
  const labelOffset = BAR_OFFSET + BAR_THICKNESS;
  // Vertical axis: labels sit left of the bar, in the band between the stage edge and the axis.
  const sideRoom = layout.baseline - labelOffset - 8;
  context.font = LABEL_FONT;
  context.textBaseline = 'middle';
  context.textAlign = horizontal ? 'center' : 'right';
  const touches = (range: VerseIndexRange | null, start: number, end: number) =>
    range !== null && range.start <= end && range.end >= start;

  for (const book of BOOKS) {
    const range = versification.bookRange(book.id);
    const from = Math.max(along(range.start), layout.axisStart);
    const to = Math.min(along(range.end + 1), layout.axisEnd);
    const room = to - from;
    if (room <= 0) continue;
    const candidates = [book.name, book.id];
    const label = horizontal
      ? candidates.find((text) => context.measureText(text).width + 8 <= room)
      : room >= 12
        ? candidates.find((text) => context.measureText(text).width <= sideRoom)
        : undefined;
    if (label === undefined) continue;
    const isActive =
      touches(focus, range.start, range.end) ||
      touches(hover, range.start, range.end) ||
      touches(passage, range.start, range.end);
    context.fillStyle = isActive ? TEXT : MUTED;
    const center = (from + to) / 2;
    if (horizontal) {
      context.fillText(label, center, layout.baseline + labelOffset + 12);
    } else {
      context.fillText(label, layout.baseline - labelOffset - 5, center);
    }
  }
}

function paintGenreLabels(
  context: CanvasRenderingContext2D,
  { layout, versification }: AxisPaint,
  along: (verse: number) => number,
): void {
  context.font = GENRE_FONT;
  context.textAlign = 'center';
  const y = layout.baseline + BAR_OFFSET + BAR_THICKNESS + 32;
  for (const genre of GENRES) {
    const books = getGenreBooks(genre.id);
    const first = books[0];
    const last = books.at(-1);
    if (!first || !last) continue;
    const from = Math.max(along(versification.bookRange(first).start), layout.axisStart);
    const to = Math.min(along(versification.bookRange(last).end + 1), layout.axisEnd);
    const label = genre.name.toUpperCase();
    if (to - from < context.measureText(label).width + 16) continue;
    const center = (from + to) / 2;
    const textWidth = context.measureText(label).width;
    context.fillStyle = elementAt(GENRE_HEX, genre.ordinal);
    context.fillRect(center - textWidth / 2 - 12, y - 1, 8, 2);
    context.fillStyle = MUTED;
    context.fillText(label, center + 2, y);
  }
}

function paintOverview(
  context: CanvasRenderingContext2D,
  { layout, view, versification }: AxisPaint,
): void {
  const total = versification.verseCount;
  if (view.end - view.start >= total - 0.5) return;
  const horizontal = layout.orientation === 'horizontal';
  const length = horizontal ? layout.width - 64 : layout.height - 64;
  const offset = 32;
  const position = (verse: number) => offset + (verse / total) * length;
  for (const genre of GENRES) {
    const books = getGenreBooks(genre.id);
    const first = books[0];
    const last = books.at(-1);
    if (!first || !last) continue;
    const from = position(versification.bookRange(first).start);
    const to = position(versification.bookRange(last).end + 1);
    context.fillStyle = elementAt(GENRE_HEX, genre.ordinal);
    if (horizontal) context.fillRect(from, 6, to - from, 3);
    else context.fillRect(layout.width - 9, from, 3, to - from);
  }
  context.strokeStyle = TEXT;
  context.lineWidth = 1;
  const from = position(view.start);
  const to = position(view.end);
  if (horizontal) context.strokeRect(from - 0.5, 2.5, Math.max(to - from, 3) + 1, 10);
  else context.strokeRect(layout.width - 13.5, from - 0.5, 10, Math.max(to - from, 3) + 1);
}
