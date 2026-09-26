import { useMemo, useState } from 'react';
import type { BookId } from '../../core/bible/books.ts';
import { passageRange, type Passage } from '../../core/bible/passage.ts';
import { BothDirectionsIcon, IncomingIcon, OutgoingIcon } from '../../shared/ui/icons.tsx';
import { Credits } from '../shared/components/Credits.tsx';
import { FiltersMenu } from '../shared/components/FiltersMenu.tsx';
import { GenreMenu } from '../shared/components/GenreMenu.tsx';
import { toggleGenre } from '../shared/components/GenreToggles.tsx';
import { PassagePanel } from '../shared/components/PassagePanel.tsx';
import { ReferenceSearch } from '../shared/components/ReferenceSearch.tsx';
import { SegmentedControl } from '../shared/components/SegmentedControl.tsx';
import { VizPage } from '../shared/components/VizPage.tsx';
import type { Connection } from '../shared/connections.ts';
import { DEFAULT_LINK_FILTER, selectLinks } from '../shared/link-filter.ts';
import type { VizData } from '../shared/viz-data.ts';
import type { VisualizationProps } from '../visualization.ts';
import { ThreadsStage, type ThreadDirection } from './ThreadsStage.tsx';

/** Where reading starts without a `?ref=`: the Bible's own statement of connection. */
const DEFAULT_CHAPTER = { book: 'John', chapter: 1 } as const satisfies {
  readonly book: BookId;
  readonly chapter: number;
};

const DIRECTIONS = [
  { value: 'outgoing', label: 'Points to', icon: OutgoingIcon },
  { value: 'incoming', label: 'Pointed from', icon: IncomingIcon },
  { value: 'both', label: 'Both', icon: BothDirectionsIcon },
] as const;

function chapterOf(passage: Passage | null, data: VizData): { book: BookId; chapter: number } {
  if (!passage) {
    return DEFAULT_CHAPTER;
  }
  if (passage.kind === 'chapter') {
    return { book: passage.book, chapter: passage.chapter };
  }
  const { book, chapter } = data.versification.refAt(
    passageRange(passage, data.versification).start,
  );
  return { book, chapter };
}

export function ThreadsExplorer({
  data,
  passage,
  onNavigate,
  filter,
  onFilterChange,
  masthead,
  passageLinks,
  shareUrl,
}: VisualizationProps) {
  const [direction, setDirection] = useState<ThreadDirection>('outgoing');
  const { book, chapter } = chapterOf(passage, data);
  const selectedVerse = passage?.kind === 'verse' ? passage.verse : null;
  const { index } = data.crossReferences;
  const shownLinks = useMemo(
    () => selectLinks(index, data.verseGenres, filter).length,
    [index, data.verseGenres, filter],
  );
  // Closing the details keeps the chapter.
  const closePanel = () => {
    onNavigate({ kind: 'chapter', book, chapter });
  };
  // A connection pointed at in the panel; it belongs to the passage it was pointed at on.
  const [preview, setPreview] = useState<{
    readonly passage: Passage;
    readonly connection: Connection;
  } | null>(null);
  const previewed = preview?.passage === passage ? preview.connection : null;

  return (
    <VizPage
      masthead={masthead}
      credits={<Credits />}
      onPanelClose={closePanel}
      controls={
        <>
          <ReferenceSearch versification={data.versification} onSelect={onNavigate} />
          <SegmentedControl
            label="Thread direction"
            options={DIRECTIONS}
            value={direction}
            onChange={setDirection}
            iconsOnlyOnPhones
          />
          <GenreMenu
            hiddenGenres={filter.hiddenGenres}
            onToggle={(genre) => {
              onFilterChange({ ...filter, hiddenGenres: toggleGenre(filter.hiddenGenres, genre) });
            }}
          />
          <FiltersMenu
            filter={filter}
            defaults={DEFAULT_LINK_FILTER}
            onChange={onFilterChange}
            shownLinks={shownLinks}
            totalLinks={index.linkCount}
          />
        </>
      }
      panel={
        selectedVerse !== null && (
          <PassagePanel
            data={data}
            passage={{ kind: 'verse', verse: selectedVerse }}
            filter={filter}
            actions={passageLinks({ kind: 'verse', verse: selectedVerse })}
            onSelect={onNavigate}
            onClose={closePanel}
            shareUrl={shareUrl}
            onPreview={(connection) => {
              setPreview(connection && passage && { passage, connection });
            }}
          />
        )
      }
    >
      <ThreadsStage
        data={data}
        book={book}
        chapter={chapter}
        selectedVerse={selectedVerse}
        filter={filter}
        direction={direction}
        preview={previewed}
        onSelect={onNavigate}
      />
    </VizPage>
  );
}
