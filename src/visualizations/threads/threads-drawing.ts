import { getBook, type BookId } from '../../core/bible/books.ts';
import type { VerseIndex } from '../../core/bible/verse-ref.ts';
import type { VerseIndexRange } from '../../core/bible/versification.ts';
import { elementAt } from '../../core/lib/array.ts';
import type { Connection } from '../shared/connections.ts';
import { GENRE_HEX } from '../shared/palette.ts';
import { voteWeight } from '../shared/vote-weight.ts';
import type { SpineLayout } from './spine-layout.ts';

/** Where a verse of the reading pane sits, relative to the canvas top. */
export interface VerseAnchor {
  readonly verse: VerseIndex;
  readonly y: number;
}

export interface ThreadsDrawing {
  readonly width: number;
  readonly height: number;
  /** Width of the thread area; the spine bar starts right after it. */
  readonly gutterWidth: number;
  readonly compact: boolean;
  readonly spine: SpineLayout;
  readonly anchors: readonly VerseAnchor[];
  readonly connectionsByVerse: ReadonlyMap<VerseIndex, readonly Connection[]>;
  readonly verseGenres: Uint8Array;
  /** The chapter being read ("you are here" on the spine). */
  readonly chapter: VerseIndexRange;
  /** A hovered or selected verse whose threads stand out. */
  readonly emphasizedVerse: VerseIndex | null;
  /** A hovered book on the spine whose incoming threads stand out. */
  readonly emphasizedBook: BookId | null;
  /** A link pointed at in the details panel: it alone stands out. */
  readonly emphasizedLink: number | null;
}

const TEXT = '#ecebe6';
const MUTED = '#9a9890';
const LABEL_FONT = '10px system-ui, -apple-system, "Segoe UI", sans-serif';

/** Horizontal position of the spine bar and its width. */
export function spineBar(drawing: Pick<ThreadsDrawing, 'gutterWidth' | 'compact'>): {
  readonly left: number;
  readonly width: number;
} {
  return { left: drawing.gutterWidth + 2, width: drawing.compact ? 6 : 8 };
}

/** Draws the threads from the visible verses to the spine, then the spine itself. */
export function drawThreads(context: CanvasRenderingContext2D, drawing: ThreadsDrawing): void {
  context.clearRect(0, 0, drawing.width, drawing.height);
  drawConnections(context, drawing);
  drawSpine(context, drawing);
}

function drawConnections(context: CanvasRenderingContext2D, drawing: ThreadsDrawing): void {
  const { spine, gutterWidth, emphasizedVerse, emphasizedBook, emphasizedLink } = drawing;
  const bar = spineBar(drawing);
  const hasEmphasis =
    emphasizedVerse !== null || emphasizedBook !== null || emphasizedLink !== null;
  const landsInBook = (connection: Connection) =>
    emphasizedBook !== null &&
    spine.segments.some(
      (segment) =>
        segment.book === emphasizedBook &&
        connection.otherStart >= segment.start &&
        connection.otherStart <= segment.end,
    );

  const threads: {
    y: number;
    target: number;
    color: string;
    alpha: number;
    emphasized: boolean;
  }[] = [];
  for (const anchor of drawing.anchors) {
    for (const connection of drawing.connectionsByVerse.get(anchor.verse) ?? []) {
      const emphasized =
        emphasizedLink !== null
          ? connection.link.id === emphasizedLink
          : anchor.verse === emphasizedVerse || landsInBook(connection);
      const weight = voteWeight(connection.link.votes);
      threads.push({
        y: anchor.y,
        target: spine.yOf((connection.otherStart + connection.otherEnd) / 2),
        color: elementAt(GENRE_HEX, elementAt(drawing.verseGenres, connection.otherStart)),
        alpha: emphasized ? 0.95 : hasEmphasis ? 0.06 + 0.1 * weight : 0.18 + 0.5 * weight,
        emphasized,
      });
    }
  }
  // Faint threads first, so emphasized ones are drawn on top.
  threads.sort((a, b) => Number(a.emphasized) - Number(b.emphasized));
  const bend = gutterWidth * 0.55;
  for (const thread of threads) {
    context.globalAlpha = thread.alpha;
    context.strokeStyle = thread.color;
    context.lineWidth = thread.emphasized ? 1.6 : 1;
    context.beginPath();
    context.moveTo(0, thread.y);
    context.bezierCurveTo(
      bend,
      thread.y,
      gutterWidth - bend,
      thread.target,
      bar.left,
      thread.target,
    );
    context.stroke();
    // A landing tick just left of the spine bar.
    context.fillStyle = thread.color;
    context.fillRect(bar.left - 4, thread.target - 0.5, 4, 1);
  }
  context.globalAlpha = 1;
}

function drawSpine(context: CanvasRenderingContext2D, drawing: ThreadsDrawing): void {
  const { spine, compact, chapter, emphasizedBook } = drawing;
  const bar = spineBar(drawing);
  const labelX = bar.left + bar.width + 5;
  context.font = LABEL_FONT;
  context.textBaseline = 'middle';
  context.textAlign = 'left';

  for (const [index, segment] of spine.segments.entries()) {
    context.globalAlpha = index % 2 === 0 ? 1 : 0.72;
    context.fillStyle = elementAt(GENRE_HEX, segment.genreOrdinal);
    context.fillRect(bar.left, segment.top, bar.width, Math.max(segment.bottom - segment.top, 0.5));
  }
  context.globalAlpha = 1;

  for (const segment of spine.segments) {
    const height = segment.bottom - segment.top;
    const isHovered = segment.book === emphasizedBook;
    if (height < (compact ? 12 : 10) && !isHovered) continue;
    const book = getBook(segment.book);
    const room = drawing.width - labelX - 2;
    const label = [book.name, book.id].find((text) => context.measureText(text).width <= room);
    if (label === undefined) continue;
    context.fillStyle = isHovered ? TEXT : MUTED;
    context.fillText(label, labelX, (segment.top + segment.bottom) / 2);
  }

  // "You are here": a bracket around the current chapter.
  const top = spine.yOf(chapter.start) - 2;
  const bottom = Math.max(spine.yOf(chapter.end) + 2, top + 4);
  context.fillStyle = TEXT;
  context.fillRect(bar.left - 3, top, 2, bottom - top);
  context.beginPath();
  context.moveTo(bar.left - 3, (top + bottom) / 2 - 4);
  context.lineTo(bar.left - 8, (top + bottom) / 2);
  context.lineTo(bar.left - 3, (top + bottom) / 2 + 4);
  context.fill();
}
