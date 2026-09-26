import { Fragment, useEffect, useId, useMemo, useState, type ReactNode } from 'react';
import { getBook } from '../../../core/bible/books.ts';
import { GENRES, getBookGenre } from '../../../core/bible/genres.ts';
import {
  chapterPassageOf,
  formatPassage,
  passageRange,
  toPassageOsisId,
  versePassage,
  type Passage,
} from '../../../core/bible/passage.ts';
import { formatVerseIndexRange, formatVerseRef } from '../../../core/bible/reference-format.ts';
import type { VerseIndex } from '../../../core/bible/verse-ref.ts';
import type { Versification } from '../../../core/bible/versification.ts';
import { elementAt } from '../../../core/lib/array.ts';
import { formatInteger } from '../../../shared/lib/format.ts';
import { useBooleanPreference } from '../../../shared/lib/preferences.ts';
import {
  CloseIcon,
  CopiedIcon,
  CopyIcon,
  ExpandIcon,
  IncomingIcon,
  NextIcon,
  OutgoingIcon,
  PreviousIcon,
  type IconComponent,
} from '../../../shared/ui/icons.tsx';
import type { Translation } from '../../../translations/translation.ts';
import { collectConnections, groupByBook, landingNote, type Connection } from '../connections.ts';
import type { LinkFilter } from '../link-filter.ts';
import { canCopy, copyQuote, quotePassage, type PassageQuote } from '../passage-quote.ts';
import { GENRE_COLORS, GENRE_HEX } from '../palette.ts';
import type { VizData } from '../viz-data.ts';
import styles from './PassagePanel.module.css';

interface PassagePanelProps {
  readonly data: VizData;
  readonly passage: Passage;
  readonly filter: LinkFilter;
  /** Links that open the passage elsewhere, e.g. in another visualization. */
  readonly actions?: ReactNode;
  readonly onSelect: (passage: Passage) => void;
  readonly onClose: () => void;
  /**
   * A connection is pointed at (mouse) or focused (keyboard), or no longer is: the visualization
   * can show that one link, and the whole passage it points to.
   */
  readonly onPreview?: (connection: Connection | null) => void;
  /** A passage's address on the published site, for copied quotes. */
  readonly shareUrl: (passage: Passage) => string;
}

const INITIAL_ITEMS = 40;
/** How long the copy button shows that it copied. */
const COPIED_FEEDBACK_MS = 1600;

/**
 * Copies a verse or passage, in full, with its reference and link, e.g. to quote it in a
 * discussion. It shows on hover (on touch screens, always, dimmed), and not at all where the page
 * can't use the clipboard.
 */
function CopyQuoteButton({
  reference,
  quote,
}: {
  readonly reference: string;
  readonly quote: () => PassageQuote;
}) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setCopied(false);
    }, COPIED_FEEDBACK_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [copied]);
  if (!canCopy()) {
    return null;
  }
  return (
    <>
      <button
        type="button"
        className={styles.copy}
        data-copied={copied}
        aria-label={`Copy ${reference} with a link`}
        title="Copy with a link"
        onClick={() => {
          void copyQuote(quote()).then(
            () => {
              setCopied(true);
            },
            () => undefined,
          );
        }}
      >
        {copied ? <CopiedIcon /> : <CopyIcon />}
      </button>
      <span className={styles.visuallyHidden} role="status">
        {copied ? `${reference} copied` : ''}
      </span>
    </>
  );
}

function neighbor(passage: Passage, step: -1 | 1, versification: Versification): Passage | null {
  const range = passageRange(passage, versification);
  const verse = step < 0 ? range.start - 1 : range.end + 1;
  if (!versification.isValidIndex(verse)) {
    return null;
  }
  return passage.kind === 'verse' ? versePassage(verse) : chapterPassageOf(verse, versification);
}

function verseTextOrNote(translation: Translation, verse: VerseIndex): string {
  return (
    translation.verseText(verse) ||
    `Omitted in the ${translation.manifest.abbreviation} (not in the earliest manuscripts).`
  );
}

/** A linked passage longer than this shows its first verses, and how many more there are. */
const MAX_PASSAGE_VERSES = 12;

/**
 * The text a connection leads to, in full: a verse, or a passage's verses with their numbers (up
 * to `MAX_PASSAGE_VERSES`; a very long passage says how much more there is).
 */
function ConnectionText({
  translation,
  versification,
  start,
  end,
}: {
  readonly translation: Translation;
  readonly versification: Versification;
  readonly start: VerseIndex;
  readonly end: VerseIndex;
}) {
  if (start === end) {
    return <span className={styles.snippet}>{verseTextOrNote(translation, start)}</span>;
  }
  const first = versification.refAt(start);
  const last = Math.min(end, start + MAX_PASSAGE_VERSES - 1);
  const verses = Array.from({ length: last - start + 1 }, (_, offset) => start + offset);
  const more = end - last;
  return (
    <span className={styles.snippet}>
      {verses.map((verse) => {
        const ref = versification.refAt(verse);
        const mark =
          ref.book !== first.book
            ? formatVerseRef(ref)
            : ref.chapter !== first.chapter
              ? `${String(ref.chapter)}:${String(ref.verse)}`
              : String(ref.verse);
        return (
          <Fragment key={verse}>
            <sup className={styles.verseMark}>{mark}</sup>
            {verseTextOrNote(translation, verse)}{' '}
          </Fragment>
        );
      })}
      {more > 0 && (
        <span className={styles.moreVerses}>
          + {formatInteger(more)} more {more === 1 ? 'verse' : 'verses'}
        </span>
      )}
    </span>
  );
}

/**
 * Details of the focused passage: its text, where it connects (by genre) and every connection,
 * grouped by book. Every connection is a button that travels there, so nothing depends on hover.
 */
export function PassagePanel({
  data,
  passage,
  filter,
  actions,
  onSelect,
  onClose,
  onPreview,
  shareUrl,
}: PassagePanelProps) {
  const { versification, translation, crossReferences, verseGenres } = data;
  const connections = useMemo(
    () =>
      collectConnections(
        crossReferences.index,
        passageRange(passage, versification),
        filter,
        verseGenres,
      ),
    [crossReferences.index, passage, versification, filter, verseGenres],
  );
  const range = passageRange(passage, versification);
  const book = versification.bookAt(range.start);
  const genre = getBookGenre(book.id);
  const previous = neighbor(passage, -1, versification);
  const next = neighbor(passage, 1, versification);
  const unit = passage.kind === 'verse' ? 'verse' : 'chapter';

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>
            <span className={styles.key} style={{ background: GENRE_COLORS[genre.id] }} />
            {genre.name} · {book.testament === 'OT' ? 'Old Testament' : 'New Testament'}
          </p>
          <h2 className={styles.title}>{formatPassage(passage, versification)}</h2>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          disabled={!previous}
          aria-label={`Previous ${unit}`}
          onClick={() => {
            if (previous) onSelect(previous);
          }}
        >
          <PreviousIcon />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          disabled={!next}
          aria-label={`Next ${unit}`}
          onClick={() => {
            if (next) onSelect(next);
          }}
        >
          <NextIcon />
        </button>
        <button type="button" className={styles.iconButton} aria-label="Close" onClick={onClose}>
          <CloseIcon />
        </button>
      </header>

      {/* Keyed by passage: following a link starts the new passage's details at the top. */}
      <div key={toPassageOsisId(passage, versification)} className={styles.scroll}>
        {/* A verse's links follow its text; a chapter's come before its (long) list of verses. */}
        {passage.kind === 'verse' ? (
          <>
            <div className={styles.quotable}>
              <p className={styles.verseText}>{verseTextOrNote(translation, passage.verse)}</p>
              <CopyQuoteButton
                reference={formatPassage(passage, versification)}
                quote={() =>
                  quotePassage({
                    translation,
                    versification,
                    start: passage.verse,
                    end: passage.verse,
                    url: shareUrl(passage),
                  })
                }
              />
            </div>
            {actions && <div className={styles.actions}>{actions}</div>}
          </>
        ) : (
          <>
            {actions && <div className={styles.actions}>{actions}</div>}
            <ChapterVerses
              start={range.start}
              end={range.end}
              translation={translation}
              connections={[...connections.outgoing, ...connections.incoming]}
              onSelect={onSelect}
            />
          </>
        )}
        <GenreBreakdown
          connections={[...connections.outgoing, ...connections.incoming]}
          verseGenres={verseGenres}
        />
        <ConnectionSection
          icon={OutgoingIcon}
          title="References"
          description="where this passage points"
          connections={connections.outgoing}
          showSourceVerse={passage.kind === 'chapter'}
          data={data}
          onSelect={onSelect}
          onPreview={onPreview}
          shareUrl={shareUrl}
        />
        <ConnectionSection
          icon={IncomingIcon}
          title="Referenced by"
          description="passages that point here"
          connections={connections.incoming}
          showSourceVerse={passage.kind === 'chapter'}
          data={data}
          onSelect={onSelect}
          onPreview={onPreview}
          shareUrl={shareUrl}
        />
      </div>
    </div>
  );
}

function ChapterVerses({
  start,
  end,
  translation,
  connections,
  onSelect,
}: {
  readonly start: VerseIndex;
  readonly end: VerseIndex;
  readonly translation: Translation;
  readonly connections: readonly Connection[];
  readonly onSelect: (passage: Passage) => void;
}) {
  const counts = new Map<VerseIndex, number>();
  for (const connection of connections) {
    counts.set(connection.here, (counts.get(connection.here) ?? 0) + 1);
  }
  const verses = Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
  return (
    <div>
      <h3 className={styles.sectionTitle}>
        Verses <span>· tap one to focus it</span>
      </h3>
      {verses.map((verse, offset) => (
        <button
          key={verse}
          type="button"
          className={styles.verseRow}
          onClick={() => {
            onSelect(versePassage(verse));
          }}
        >
          <span className={styles.verseNumber}>{offset + 1}</span>
          <span className={styles.snippet}>{verseTextOrNote(translation, verse)}</span>
          <span className={styles.count}>{formatInteger(counts.get(verse) ?? 0)}</span>
        </button>
      ))}
    </div>
  );
}

/**
 * Where the passage's links go, by genre. It starts as a quiet summary (a strip in the genres'
 * colors and the number of links), so the connections themselves stay the focus; the reader can
 * open the details, and the choice is remembered.
 */
function GenreBreakdown({
  connections,
  verseGenres,
}: {
  readonly connections: readonly Connection[];
  readonly verseGenres: Uint8Array;
}) {
  const [expanded, setExpanded] = useBooleanPreference('genre-breakdown-expanded', false);
  const detailsId = useId();
  if (connections.length === 0) {
    return null;
  }
  const counts = new Array<number>(GENRES.length).fill(0);
  for (const connection of connections) {
    const genre = elementAt(verseGenres, connection.otherStart);
    counts[genre] = (counts[genre] ?? 0) + 1;
  }
  const max = Math.max(...counts);
  const present = GENRES.filter((genre) => (counts[genre.ordinal] ?? 0) > 0);
  return (
    <section className={styles.genres}>
      <button
        type="button"
        className={styles.genresToggle}
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => {
          setExpanded(!expanded);
        }}
      >
        <span className={styles.genresLabel}>Connects to</span>
        <span className={styles.strip} aria-hidden="true">
          {present.map((genre) => (
            <span
              key={genre.id}
              style={{
                flexGrow: counts[genre.ordinal] ?? 0,
                background: elementAt(GENRE_HEX, genre.ordinal),
              }}
            />
          ))}
        </span>
        <span className={styles.count}>
          {formatInteger(connections.length)}
          <span className={styles.visuallyHidden}>
            {' '}
            links in {present.length} {present.length === 1 ? 'genre' : 'genres'}
          </span>
        </span>
        <ExpandIcon className={styles.chevron} />
      </button>
      {expanded && (
        <div id={detailsId} className={styles.breakdown}>
          {GENRES.filter((genre) => (counts[genre.ordinal] ?? 0) > 0).map((genre) => {
            const count = counts[genre.ordinal] ?? 0;
            return (
              <div key={genre.id} style={{ display: 'contents' }}>
                <span>{genre.name}</span>
                <span
                  className={styles.bar}
                  style={{
                    inlineSize: `${Math.max((count / max) * 100, 2)}%`,
                    background: elementAt(GENRE_HEX, genre.ordinal),
                  }}
                />
                <span className={styles.count}>{formatInteger(count)}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ConnectionSection({
  icon: Icon,
  title,
  description,
  connections,
  showSourceVerse,
  data,
  onSelect,
  onPreview,
  shareUrl,
}: {
  /** The link direction, drawn as in the reading-threads direction switch. */
  readonly icon: IconComponent;
  readonly title: string;
  readonly description: string;
  readonly connections: readonly Connection[];
  readonly showSourceVerse: boolean;
  readonly data: VizData;
  readonly onSelect: (passage: Passage) => void;
  readonly onPreview: ((connection: Connection | null) => void) | undefined;
  readonly shareUrl: (passage: Passage) => string;
}) {
  const [limit, setLimit] = useState(INITIAL_ITEMS);
  const { versification, translation } = data;
  const visible = connections.slice(0, limit);
  return (
    <section>
      <h3 className={styles.sectionTitle}>
        <Icon className={styles.sectionIcon} />
        {title} <span>· {description}</span>
      </h3>
      {connections.length === 0 && <p className={styles.muted}>None</p>}
      {groupByBook(visible, versification).map((group) => (
        <div
          key={`${group.book}-${String(group.connections[0]?.otherStart)}`}
          className={styles.group}
        >
          <p className={styles.groupHeader}>
            <span
              className={styles.key}
              style={{ background: GENRE_COLORS[getBookGenre(group.book).id] }}
            />
            {getBook(group.book).name}
            <span className={styles.count}>{formatInteger(group.connections.length)}</span>
          </p>
          {group.connections.map((connection) => {
            const note = landingNote(connection, versification, showSourceVerse);
            const reference = formatVerseIndexRange(
              versification,
              connection.otherStart,
              connection.otherEnd,
            );
            return (
              <div
                key={`${String(connection.link.id)}-${connection.direction}`}
                className={styles.quotable}
                onPointerEnter={(event) => {
                  if (event.pointerType === 'mouse') onPreview?.(connection);
                }}
                onPointerLeave={() => {
                  onPreview?.(null);
                }}
              >
                <button
                  type="button"
                  className={styles.item}
                  onClick={() => {
                    onSelect(versePassage(connection.otherStart));
                  }}
                  onFocus={() => {
                    onPreview?.(connection);
                  }}
                  onBlur={() => {
                    onPreview?.(null);
                  }}
                >
                  <span className={styles.itemRef}>
                    <strong>{reference}</strong>
                    {note !== null && <span className={styles.muted}>{note}</span>}
                  </span>
                  <ConnectionText
                    translation={translation}
                    versification={versification}
                    start={connection.otherStart}
                    end={connection.otherEnd}
                  />
                </button>
                <CopyQuoteButton
                  reference={reference}
                  quote={() =>
                    quotePassage({
                      translation,
                      versification,
                      start: connection.otherStart,
                      end: connection.otherEnd,
                      url: shareUrl(versePassage(connection.otherStart)),
                    })
                  }
                />
              </div>
            );
          })}
        </div>
      ))}
      {connections.length > limit && (
        <button
          type="button"
          className={styles.more}
          onClick={() => {
            setLimit(connections.length);
          }}
        >
          Show all {formatInteger(connections.length)}
          <ExpandIcon />
        </button>
      )}
    </section>
  );
}
