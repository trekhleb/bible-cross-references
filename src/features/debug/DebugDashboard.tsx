import { useCallback, useState } from 'react';
import type { VerseIndex } from '../../core/bible/verse-ref.ts';
import { CANONICAL_VERSIFICATION } from '../../core/bible/versification.ts';
import type { CrossReferenceSourceId } from '../../core/datasets/ids.ts';
import { CrossReferencesSection } from './components/CrossReferencesSection.tsx';
import { DatasetsSection } from './components/DatasetsSection.tsx';
import { TextSearch } from './components/TextSearch.tsx';
import { TranslationSection } from './components/TranslationSection.tsx';
import { VerseInspector } from './components/VerseInspector.tsx';
import type { DebugData } from './debug-data.ts';
import { VerseNavigationContext } from './verse-navigation.ts';
import { readVerseFromUrl, writeVerseToUrl } from './verse-url.ts';

export const SECTION_IDS = {
  datasets: 'datasets',
  translation: 'translation',
  inspector: 'inspector',
  search: 'search',
} as const;

export function crossReferencesSectionId(sourceId: CrossReferenceSourceId): string {
  return `cross-references-${sourceId}`;
}

const DEFAULT_VERSE: VerseIndex =
  CANONICAL_VERSIFICATION.indexOf({ book: 'John', chapter: 3, verse: 16 }) ?? 0;

interface DebugDashboardProps {
  readonly data: DebugData;
}

export function DebugDashboard({ data }: DebugDashboardProps) {
  const { translation, crossReferences } = data;
  const [selectedVerse, setSelectedVerse] = useState(() => readVerseFromUrl() ?? DEFAULT_VERSE);

  const selectVerse = useCallback((verse: VerseIndex) => {
    setSelectedVerse(verse);
    writeVerseToUrl(verse);
    document
      .getElementById(SECTION_IDS.inspector)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const datasets = crossReferences.map(({ dataset }) => dataset);
  return (
    <VerseNavigationContext value={selectVerse}>
      <DatasetsSection
        id={SECTION_IDS.datasets}
        reports={[translation.report, ...crossReferences.map(({ report }) => report)]}
      />
      <TranslationSection id={SECTION_IDS.translation} translation={translation.translation} />
      {datasets.map((dataset) => (
        <CrossReferencesSection
          key={dataset.manifest.id}
          id={crossReferencesSectionId(dataset.manifest.id)}
          dataset={dataset}
        />
      ))}
      <VerseInspector
        id={SECTION_IDS.inspector}
        verse={selectedVerse}
        translation={translation.translation}
        datasets={datasets}
      />
      <TextSearch id={SECTION_IDS.search} translation={translation.translation} />
    </VerseNavigationContext>
  );
}
