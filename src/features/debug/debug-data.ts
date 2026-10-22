import {
  loadCrossReferences,
  type LoadedCrossReferences,
} from '../../cross-references/load-cross-references.ts';
import { CROSS_REFERENCE_SOURCE_MANIFESTS } from '../../cross-references/registry.ts';
import { loadTranslation, type LoadedTranslation } from '../../translations/load-translation.ts';
import { selectedTranslation } from '../../translations/selection.ts';
import { createCachedLoader } from '../../shared/lib/cached-loader.ts';

export interface DebugData {
  readonly translation: LoadedTranslation;
  readonly crossReferences: readonly LoadedCrossReferences[];
}

/** Loads the default translation and every registered cross-reference source in parallel. */
export const debugDataLoader = createCachedLoader(async (): Promise<DebugData> => {
  const [translation, crossReferences] = await Promise.all([
    loadTranslation(selectedTranslation()),
    Promise.all(CROSS_REFERENCE_SOURCE_MANIFESTS.map(loadCrossReferences)),
  ]);
  return { translation, crossReferences };
});
