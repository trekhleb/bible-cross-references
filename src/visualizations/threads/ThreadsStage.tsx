import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { getBook, type BookId } from '../../core/bible/books.ts';
import { getBookGenre } from '../../core/bible/genres.ts';
import { chapterPassageOf, versePassage, type Passage } from '../../core/bible/passage.ts';
import type { VerseIndex } from '../../core/bible/verse-ref.ts';
import { formatInteger } from '../../shared/lib/format.ts';
import { NextIcon, PreviousIcon } from '../../shared/ui/icons.tsx';
import { collectConnections, type Connection } from '../shared/connections.ts';
import type { LinkFilter } from '../shared/link-filter.ts';
import { GENRE_COLORS } from '../shared/palette.ts';
import { useElementSize } from '../shared/use-element-size.ts';
import type { VizData } from '../shared/viz-data.ts';
import { FrameScheduler, MAX_PIXEL_RATIO } from '../shared/frames.ts';
import { computeSpineLayout } from './spine-layout.ts';
import { drawThreads, spineBar, type VerseAnchor } from './threads-drawing.ts';
import styles from './ThreadsStage.module.css';

export type ThreadDirection = 'outgoing' | 'incoming' | 'both';

interface ThreadsStageProps {
  readonly data: VizData;
  readonly book: BookId;
  readonly chapter: number;
  readonly selectedVerse: VerseIndex | null;
  readonly filter: LinkFilter;
  readonly direction: ThreadDirection;
  /**
   * A connection pointed at in the details panel: its thread stands out, and its whole passage is
   * marked where the chapter holds it (the selected verse keeps its own highlight).
   */
  readonly preview: Connection | null;
  readonly onSelect: (passage: Passage | null) => void;
}

/** Scroll distance after which the chapter header condenses into a slim sticky bar. */
const CONDENSE_AFTER_PX = 72;

/** Room for the spine bar and its labels, right of the thread area. */
const SPINE_WIDTH = { wide: 96, compact: 18 } as const;
const SPINE_TOP = 16;
const SPINE_BOTTOM_PADDING = 14;

interface SpineHover {
  readonly book: BookId;
  readonly y: number;
  readonly count: number;
}

/** A chapter to read on the left; threads from each verse to where its links land on the right. */
export function ThreadsStage({
  data,
  book,
  chapter,
  selectedVerse,
  filter,
  direction,
  preview,
  onSelect,
}: ThreadsStageProps) {
  const { versification, translation, crossReferences, verseGenres } = data;
  const readingRef = useRef<HTMLDivElement>(null);
  const canvasHostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const verseElements = useRef(new Map<VerseIndex, HTMLElement>());
  const canvasSize = useElementSize(canvasHostRef);
  const chapterHeaderRef = useRef<HTMLElement>(null);
  const [hoverVerse, setHoverVerse] = useState<VerseIndex | null>(null);
  const [condensed, setCondensed] = useState(false);
  const [topVerse, setTopVerse] = useState<VerseIndex | null>(null);
  const [spineHover, setSpineHover] = useState<SpineHover | null>(null);

  const range = versification.chapterRange(book, chapter) ?? { start: 0, end: 0 };
  const { start, end } = range;
  const compact = canvasSize.width < 120;
  const gutterWidth = canvasSize.width - (compact ? SPINE_WIDTH.compact : SPINE_WIDTH.wide);

  const connectionsByVerse = useMemo(() => {
    const connections = collectConnections(
      crossReferences.index,
      { start, end },
      filter,
      verseGenres,
    );
    const shown: Connection[] = [
      ...(direction === 'incoming' ? [] : connections.outgoing),
      ...(direction === 'outgoing' ? [] : connections.incoming),
    ];
    const byVerse = new Map<VerseIndex, Connection[]>();
    for (const connection of shown) {
      byVerse.set(connection.here, [...(byVerse.get(connection.here) ?? []), connection]);
    }
    return byVerse;
  }, [crossReferences.index, start, end, filter, verseGenres, direction]);

  const spine = useMemo(
    () =>
      computeSpineLayout(versification, SPINE_TOP, canvasSize.height - SPINE_BOTTOM_PADDING, {
        book: compact ? 0.5 : 1,
        genre: compact ? 3 : 5,
      }),
    [versification, canvasSize.height, compact],
  );

  const emphasizedVerse = hoverVerse ?? selectedVerse;
  const emphasizedBook = spineHover?.book ?? null;
  // Only a thread that is drawn (the direction switch may hide it) can stand out alone.
  const emphasizedLink = useMemo(() => {
    const id = preview?.link.id;
    if (id === undefined) return null;
    for (const list of connectionsByVerse.values()) {
      if (list.some((connection) => connection.link.id === id)) return id;
    }
    return null;
  }, [preview, connectionsByVerse]);
  const linked = preview && { start: preview.link.targetStart, end: preview.link.targetEnd };

  // Redraw on any input change, and on every scroll frame of the reading pane.
  useEffect(() => {
    const canvas = canvasRef.current;
    const reading = readingRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !reading || !context || canvasSize.width === 0) {
      return undefined;
    }
    const ratio = Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO);
    canvas.width = Math.round(canvasSize.width * ratio);
    canvas.height = Math.round(canvasSize.height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const scheduler = new FrameScheduler(() => {
      const top = canvas.getBoundingClientRect().top;
      // Verses scrolled under the sticky chapter header send no threads.
      const clipTop = (chapterHeaderRef.current?.getBoundingClientRect().bottom ?? top) - top;
      const anchors: VerseAnchor[] = [];
      for (const [verse, element] of verseElements.current) {
        const rect = element.getBoundingClientRect();
        // Threads leave from a verse's first line, so long verses stay readable.
        const y = rect.top - top + Math.min(rect.height / 2, 15);
        if (y >= clipTop && y <= canvasSize.height) {
          anchors.push({ verse, y });
        }
      }
      drawThreads(context, {
        width: canvasSize.width,
        height: canvasSize.height,
        gutterWidth,
        compact,
        spine,
        anchors,
        connectionsByVerse,
        verseGenres,
        chapter: { start, end },
        emphasizedVerse,
        emphasizedBook,
        emphasizedLink,
      });
    });
    scheduler.request();
    const onScroll = () => {
      scheduler.request();
    };
    reading.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      reading.removeEventListener('scroll', onScroll);
      scheduler.dispose();
    };
  }, [
    canvasSize,
    gutterWidth,
    compact,
    spine,
    connectionsByVerse,
    verseGenres,
    start,
    end,
    emphasizedVerse,
    emphasizedBook,
    emphasizedLink,
  ]);

  // Condense the chapter header once the reader scrolls, and track the verse at the top.
  useEffect(() => {
    const reading = readingRef.current;
    if (!reading) {
      return undefined;
    }
    const scheduler = new FrameScheduler(() => {
      setCondensed(reading.scrollTop > CONDENSE_AFTER_PX);
      const headerBottom =
        chapterHeaderRef.current?.getBoundingClientRect().bottom ??
        reading.getBoundingClientRect().top;
      let first: VerseIndex | null = null;
      for (const [verse, element] of verseElements.current) {
        if (element.getBoundingClientRect().bottom > headerBottom + 4) {
          first = first === null ? verse : Math.min(first, verse);
        }
      }
      setTopVerse(first);
    });
    scheduler.request();
    const onScroll = () => {
      scheduler.request();
    };
    reading.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      reading.removeEventListener('scroll', onScroll);
      scheduler.dispose();
    };
  }, [start, end]);

  // Keep the selected verse in view when it changes (e.g. after following a connection).
  useEffect(() => {
    const element = selectedVerse === null ? null : verseElements.current.get(selectedVerse);
    const reading = readingRef.current;
    if (!element || !reading) {
      return;
    }
    const verseRect = element.getBoundingClientRect();
    const paneRect = reading.getBoundingClientRect();
    if (verseRect.top < paneRect.top || verseRect.bottom > paneRect.bottom) {
      element.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [selectedVerse]);

  const verseAtSpine = (event: MouseEvent<HTMLElement>): VerseIndex | null => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    return x >= spineBar({ gutterWidth, compact }).left - 6
      ? spine.verseAt(event.clientY - rect.top)
      : null;
  };

  const verses = Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
  const genre = getBookGenre(book);
  const previousChapter = start > 0 ? chapterPassageOf(start - 1, versification) : null;
  const nextChapter =
    end + 1 < versification.verseCount ? chapterPassageOf(end + 1, versification) : null;

  return (
    <div className={styles.stage}>
      {/* Keyed by chapter: a new chapter is a new scroll container, so it starts at the top. */}
      <div key={`${book}.${chapter}`} ref={readingRef} className={styles.reading}>
        <header ref={chapterHeaderRef} className={styles.chapterHeader} data-condensed={condensed}>
          <div className={styles.column}>
            <p className={styles.eyebrow}>
              <span className={styles.key} style={{ background: GENRE_COLORS[genre.id] }} />
              {genre.name} · {genre.testament === 'OT' ? 'Old Testament' : 'New Testament'}
            </p>
            <div className={styles.titleRow}>
              <h2 className={styles.title}>
                {getBook(book).name} {chapter}
                {condensed && topVerse !== null && (
                  <span className={styles.position}>:{versification.refAt(topVerse).verse}</span>
                )}
              </h2>
              <nav className={styles.chapterNav} aria-label="Chapters">
                <button
                  type="button"
                  disabled={!previousChapter}
                  aria-label="Previous chapter"
                  onClick={() => {
                    if (previousChapter) onSelect(previousChapter);
                  }}
                >
                  <PreviousIcon />
                  <span className={styles.navLabel}>Previous chapter</span>
                </button>
                <button
                  type="button"
                  disabled={!nextChapter}
                  aria-label="Next chapter"
                  onClick={() => {
                    if (nextChapter) onSelect(nextChapter);
                  }}
                >
                  <span className={styles.navLabel}>Next chapter</span>
                  <NextIcon />
                </button>
              </nav>
            </div>
          </div>
        </header>
        <div className={styles.column}>
          <ol className={styles.verses}>
            {verses.map((verse, offset) => {
              const text = translation.verseText(verse);
              const count = connectionsByVerse.get(verse)?.length ?? 0;
              return (
                <li
                  key={verse}
                  ref={(element) => {
                    const elements = verseElements.current;
                    if (element) elements.set(verse, element);
                    return () => {
                      elements.delete(verse);
                    };
                  }}
                  className={styles.verse}
                  data-selected={verse === selectedVerse}
                  data-linked={linked !== null && verse >= linked.start && verse <= linked.end}
                  onPointerEnter={(event) => {
                    if (event.pointerType === 'mouse') setHoverVerse(verse);
                  }}
                  onPointerLeave={() => {
                    setHoverVerse(null);
                  }}
                  onClick={() => {
                    onSelect(
                      verse === selectedVerse
                        ? { kind: 'chapter', book, chapter }
                        : versePassage(verse),
                    );
                  }}
                >
                  <button
                    type="button"
                    className={styles.number}
                    aria-label={`Verse ${offset + 1}: show its connections`}
                    aria-pressed={verse === selectedVerse}
                  >
                    {offset + 1}
                  </button>
                  <span className={text ? styles.text : `${styles.text} ${styles.omitted}`}>
                    {text ||
                      `Omitted in the ${translation.manifest.abbreviation} (not in the earliest manuscripts).`}
                  </span>
                  <span className={styles.count} title={`${count} connections`}>
                    {count > 0 ? formatInteger(count) : ''}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
      <div
        ref={canvasHostRef}
        className={styles.canvasHost}
        onPointerMove={(event) => {
          const verse = verseAtSpine(event);
          if (verse === null) {
            setSpineHover(null);
            return;
          }
          const target = versification.bookAt(verse).id;
          let count = 0;
          for (const list of connectionsByVerse.values()) {
            count += list.filter(
              (connection) => versification.bookAt(connection.otherStart).id === target,
            ).length;
          }
          const rect = event.currentTarget.getBoundingClientRect();
          setSpineHover({ book: target, y: event.clientY - rect.top, count });
        }}
        onPointerLeave={() => {
          setSpineHover(null);
        }}
        onClick={(event) => {
          const verse = verseAtSpine(event);
          if (verse !== null) onSelect(chapterPassageOf(verse, versification));
        }}
      >
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          role="img"
          aria-label="Threads from the verses of this chapter to where their cross-references land in the Bible, shown as a vertical bar of all 66 books."
        />
        {spineHover && (
          <div className={styles.tooltip} style={{ top: spineHover.y }}>
            {getBook(spineHover.book).name}{' '}
            <span>
              · {formatInteger(spineHover.count)} {spineHover.count === 1 ? 'thread' : 'threads'}{' '}
              from here · click to read
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
