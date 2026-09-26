import { CANONICAL_VERSIFICATION, type Versification } from '../../core/bible/versification.ts';
import {
  loadCrossReferences,
  type CrossReferenceDataset,
} from '../../cross-references/load-cross-references.ts';
import { createCachedLoader } from '../../shared/lib/cached-loader.ts';
import { loadTranslation } from '../../translations/load-translation.ts';
import type { Translation } from '../../translations/translation.ts';
import { computeVerseGenres } from './verse-genres.ts';
import { vizDatasets } from './viz-datasets.ts';

/** Everything a visualization needs, loaded once per page. */
export interface VizData {
  readonly versification: Versification;
  readonly translation: Translation;
  readonly crossReferences: CrossReferenceDataset;
  /** Genre ordinal of every verse. */
  readonly verseGenres: Uint8Array;
}

export const vizDataLoader = createCachedLoader(async (): Promise<VizData> => {
  const { translation, crossReferences } = vizDatasets();
  // Both files download at once (and the HTML has already started them, see vizDatasetPaths).
  const [loadedTranslation, loadedReferences] = await Promise.all([
    loadTranslation(translation),
    loadCrossReferences(crossReferences),
  ]);
  return {
    versification: CANONICAL_VERSIFICATION,
    translation: loadedTranslation.translation,
    crossReferences: loadedReferences.dataset,
    verseGenres: computeVerseGenres(CANONICAL_VERSIFICATION),
  };
});
