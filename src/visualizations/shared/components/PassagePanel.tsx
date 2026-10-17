import { t, verseCount } from '../../../locales/ui.ts';
import { getDisplayBookName } from '../../../core/bible/book-labels.ts';
import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';

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
import {
  CloseIcon,
  CopiedIcon,
  CopyIcon,
  ExpandIcon,
  GenresIcon,
  IncomingIcon,
  NextIcon,
  OutgoingIcon,
  ReadingIcon,
  PreviousIcon,
  type IconComponent,
} from '../../../shared/ui/icons.tsx';
import type { Translation } from '../../../translations/translation.ts';
import { verseTextOrNote } from '../../../translations/verse-text.ts';
import { collectConnections, groupByBook, landingNote, type Connection } from '../connections.ts';
import type { LinkFilter } from '../link-filter.ts';
import { canCopy, copyQuote, quotePassage, type PassageQuote } from '../passage-quote.ts';
import { GENRE_COLORS, GENRE_HEX } from '../palette.ts';
import { OriginalWordsSection } from './OriginalWordsSection.tsx';
import { PanelSection } from './PanelSection.tsx';
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
        aria-label={t('Copy {reference} with a link', { reference })}
        title={t('Copy with a link')}
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
        {copied ? t('{reference} copied', { reference }) : ''}
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
      {more > 0 && <span className={styles.moreVerses}>+ {verseCount(more)}</span>}
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

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>
            <span className={styles.key} style={{ background: GENRE_COLORS[genre.id] }} />
            {t(genre.name)} · {book.testament === 'OT' ? t('Old Testament') : t('New Testament')}
          </p>
          <h2 className={styles.title}>{formatPassage(passage, versification)}</h2>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          disabled={!previous}
          aria-label={t(passage.kind === 'verse' ? 'Previous verse' : 'Previous chapter')}
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
          aria-label={t(passage.kind === 'verse' ? 'Next verse' : 'Next chapter')}
          onClick={() => {
            if (next) onSelect(next);
          }}
        >
          <NextIcon />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={t('Close')}
          onClick={onClose}
        >
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
          id="references"
          icon={OutgoingIcon}
          title={t('References')}
          description={t('where this passage points')}
          countLabel={t('passages')}

          connections={connections.outgoing}
          showSourceVerse={passage.kind === 'chapter'}
          data={data}
          onSelect={onSelect}
          onPreview={onPreview}
          shareUrl={shareUrl}
        />
        <ConnectionSection
          id="referenced-by"
          icon={IncomingIcon}
          title={t('Referenced by')}
          description={t('passages that point here')}
          countLabel={t('passages')}

          connections={connections.incoming}
          showSourceVerse={passage.kind === 'chapter'}
          data={data}
          onSelect={onSelect}
          onPreview={onPreview}
          shareUrl={shareUrl}
        />
        {/* A verse at a time: a chapter's words would be most of its vocabulary. */}
        {passage.kind === 'verse' && (
          <OriginalWordsSection verse={passage.verse} data={data} onSelect={onSelect} />
        )}
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
    <PanelSection
      id="verses"
      icon={ReadingIcon}
      title={t('Verses')}
      description={t('tap one to focus it')}
      count={verses.length}
      countLabel={t('verses')}
    >
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
    </PanelSection>
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
    <PanelSection
      id="connects-to"
      icon={GenresIcon}
      title={t('Connects to')}
      description={t(present.length === 1 ? '{count} genre' : '{count} genres', {
        count: formatInteger(present.length),
      })}
      count={connections.length}
      countLabel={t('links')}
      defaultOpen={false}
      trailing={
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
      }
    >
      <div className={styles.breakdown}>
        {present.map((genre) => {
          const count = counts[genre.ordinal] ?? 0;
          return (
            <div key={genre.id} style={{ display: 'contents' }}>
              <span>{t(genre.name)}</span>
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
    </PanelSection>
  );
}

function ConnectionSection({
  id,
  icon: Icon,
  title,
  description,
  countLabel,
  connections,
  showSourceVerse,
  data,
  onSelect,
  onPreview,
  shareUrl,
}: {
  /** Identifies the section in storage, so a reader's choice to close it lasts. */
  readonly id: string;
  /** The link direction, drawn as in the reading-threads direction switch. */
  readonly icon: IconComponent;
  readonly title: string;
  readonly description: string;
  readonly countLabel: string;
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
    <PanelSection
      id={id}
      icon={Icon}
      title={title}
      description={description}
      count={connections.length}
      countLabel={countLabel}
    >
      {connections.length === 0 && <p className={styles.muted}>{t('None')}</p>}

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
            {getDisplayBookName(getBook(group.book))}
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
          {t('Show all')} {formatInteger(connections.length)}
          <ExpandIcon />
        </button>
      )}
    </PanelSection>
  );
}
