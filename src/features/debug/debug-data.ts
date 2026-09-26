import {
  loadCrossReferences,
  type LoadedCrossReferences,
} from '../../cross-references/load-cross-references.ts';
import { CROSS_REFERENCE_SOURCE_MANIFESTS } from '../../cross-references/registry.ts';
import { loadTranslation, type LoadedTranslation } from '../../translations/load-translation.ts';
import { DEFAULT_TRANSLATION_ID, getTranslationManifest } from '../../translations/registry.ts';
import { createCachedLoader } from '../../shared/lib/cached-loader.ts';

export interface DebugData {
  readonly translation: LoadedTranslation;
  readonly crossReferences: readonly LoadedCrossReferences[];
}

/** Loads the default translation and every registered cross-reference source in parallel. */
export const debugDataLoader = createCachedLoader(async (): Promise<DebugData> => {
  const [translation, crossReferences] = await Promise.all([
    loadTranslation(getTranslationManifest(DEFAULT_TRANSLATION_ID)),
    Promise.all(CROSS_REFERENCE_SOURCE_MANIFESTS.map(loadCrossReferences)),
  ]);
  return { translation, crossReferences };
});
