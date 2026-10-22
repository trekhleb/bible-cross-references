import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
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
import {
  collectConnections,
  groupByBook,
  landingNote,
  type Connection,
  type LandingNote,
} from '../connections.ts';
import type { LinkFilter } from '../link-filter.ts';
import { canCopy, copyQuote, quotePassage, type PassageQuote } from '../passage-quote.ts';
import { GENRE_COLORS, GENRE_HEX } from '../palette.ts';
import { OriginalWordsSection } from './OriginalWordsSection.tsx';
import { PanelSection } from './PanelSection.tsx';
import type { VizData } from '../viz-data.ts';
import { useLocalization, type Localization } from '../../../i18n/use-locale.tsx';
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
  const { t } = useLocalization();
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
        aria-label={t('panel.copy')(reference)}
        title={t('panel.copy.title')}
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
        {copied ? t('panel.copied')(reference) : ''}
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
  const { t, books, n } = useLocalization();
  // The text is in the translation's language, which is not always the interface's: a reader
  // on a Portuguese interface may be reading the KJV. Saying so is what lets a screen reader
  // pronounce it, and a right-to-left text lay itself out.
  const lang = translation.manifest.language;
  const dir = translation.manifest.direction;
  if (start === end) {
    return (
      <span className={styles.snippet} lang={lang} dir={dir}>
        {verseTextOrNote(translation, start, t('panel.omitted')(translation.manifest.abbreviation))}
      </span>
    );
  }
  const first = versification.refAt(start);
  const last = Math.min(end, start + MAX_PASSAGE_VERSES - 1);
  const verses = Array.from({ length: last - start + 1 }, (_, offset) => start + offset);
  const more = end - last;
  return (
    <span className={styles.snippet} lang={lang} dir={dir}>
      {verses.map((verse) => {
        const ref = versification.refAt(verse);
        const mark =
          ref.book !== first.book
            ? formatVerseRef(ref, books)
            : ref.chapter !== first.chapter
              ? `${String(ref.chapter)}:${String(ref.verse)}`
              : String(ref.verse);
        return (
          <Fragment key={verse}>
            <sup className={styles.verseMark}>{mark}</sup>
            {verseTextOrNote(
              translation,
              verse,
              t('panel.omitted')(translation.manifest.abbreviation),
            )}{' '}
          </Fragment>
        );
      })}
      {more > 0 && (
        <span className={styles.moreVerses}>{t('panel.moreVerses')(n(more), more)}</span>
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
  const { t, books, genreName } = useLocalization();
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
  const isVerse = passage.kind === 'verse';

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>
            <span className={styles.key} style={{ background: GENRE_COLORS[genre.id] }} />
            {genreName(genre.id)} ·{' '}
            {book.testament === 'OT' ? t('testament.OT') : t('testament.NT')}
          </p>
          <h2 className={styles.title}>{formatPassage(passage, versification, books)}</h2>
        </div>
        <button
          type="button"
          className={styles.iconButton}
          disabled={!previous}
          aria-label={t(isVerse ? 'panel.previousVerse' : 'panel.previousChapter')}
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
          aria-label={t(isVerse ? 'panel.nextVerse' : 'panel.nextChapter')}
          onClick={() => {
            if (next) onSelect(next);
          }}
        >
          <NextIcon />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label={t('panel.close')}
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
              <p
                className={styles.verseText}
                lang={translation.manifest.language}
                dir={translation.manifest.direction}
              >
                {verseTextOrNote(
                  translation,
                  passage.verse,
                  t('panel.omitted')(translation.manifest.abbreviation),
                )}
              </p>
              <CopyQuoteButton
                reference={formatPassage(passage, versification, books)}
                quote={() =>
                  quotePassage({
                    translation,
                    versification,
                    names: books,
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
          title={t('panel.references')}
          description={t('panel.references.note')}
          countLabel={t('panel.passages')}
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
          title={t('panel.referencedBy')}
          description={t('panel.referencedBy.note')}
          countLabel={t('panel.passages')}
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
  const { t, n } = useLocalization();
  const counts = new Map<VerseIndex, number>();
  for (const connection of connections) {
    counts.set(connection.here, (counts.get(connection.here) ?? 0) + 1);
  }
  const verses = Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
  return (
    <PanelSection
      id="verses"
      icon={ReadingIcon}
      title={t('panel.verses')}
      description={t('panel.verses.note')}
      count={verses.length}
      countLabel={t('panel.versesCounted')}
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
          <span className={styles.snippet}>
            {verseTextOrNote(
              translation,
              verse,
              t('panel.omitted')(translation.manifest.abbreviation),
            )}
          </span>
          <span className={styles.count}>{n(counts.get(verse) ?? 0)}</span>
        </button>
      ))}
    </PanelSection>
  );
}

/**
 * Puts a connection's landing note into words: where in the passage this link meets it. The
 * note itself is data (see `landingNote`), so that the sentence can be built in the reader's
 * own language here rather than in the code that works out the connections.
 */
function describeLandingNote(
  note: LandingNote,
  versification: Versification,
  { t, books, n }: Localization,
): string {
  switch (note.kind) {
    case 'range':
      return t('note.toRange')(formatVerseIndexRange(versification, books, note.start, note.end));
    case 'from-verse':
      return t('note.fromVerse')(n(note.verse));
    case 'to-verse':
      return t('note.toVerse')(n(note.verse));
  }
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
  const { t, n, genreName } = useLocalization();
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
      title={t('panel.connectsTo')}
      description={t('panel.connectsTo.note')(present.length)}
      count={connections.length}
      countLabel={t('panel.linksCounted')}
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
              <span>{genreName(genre.id)}</span>
              <span
                className={styles.bar}
                style={{
                  inlineSize: `${Math.max((count / max) * 100, 2)}%`,
                  background: elementAt(GENRE_HEX, genre.ordinal),
                }}
              />
              <span className={styles.count}>{n(count)}</span>
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
  /** What the count counts, inflected for it — passed straight to `PanelSection`. */
  readonly countLabel: (plural: number) => string;
  readonly connections: readonly Connection[];
  readonly showSourceVerse: boolean;
  readonly data: VizData;
  readonly onSelect: (passage: Passage) => void;
  readonly onPreview: ((connection: Connection | null) => void) | undefined;
  readonly shareUrl: (passage: Passage) => string;
}) {
  const localization = useLocalization();
  const { t, books, n } = localization;
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
      {connections.length === 0 && <p className={styles.muted}>{t('panel.none')}</p>}
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
            {books[group.book].name}
            <span className={styles.count}>{n(group.connections.length)}</span>
          </p>
          {group.connections.map((connection) => {
            const note = landingNote(connection, versification, showSourceVerse);
            const reference = formatVerseIndexRange(
              versification,
              books,
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
                    {note !== null && (
                      <span className={styles.muted}>
                        {describeLandingNote(note, versification, localization)}
                      </span>
                    )}
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
                      names: books,
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
          {t('panel.showAll')(n(connections.length))}
          <ExpandIcon />
        </button>
      )}
    </PanelSection>
  );
}
