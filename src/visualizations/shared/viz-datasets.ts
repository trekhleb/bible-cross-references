import { crossReferencesDatasetPath, translationDatasetPath } from '../../core/datasets/paths.ts';
import { CROSS_REFERENCE_SOURCE_MANIFESTS } from '../../cross-references/registry.ts';
import type { CrossReferenceSourceManifest } from '../../cross-references/source-manifest.ts';
import { DEFAULT_TRANSLATION_ID, getTranslationManifest } from '../../translations/registry.ts';
import type { TranslationManifest } from '../../translations/translation-manifest.ts';

/** The datasets the visualizations load: the default translation and cross-reference source. */
export function vizDatasets(): {
  readonly translation: TranslationManifest;
  readonly crossReferences: CrossReferenceSourceManifest;
} {
  const crossReferences = CROSS_REFERENCE_SOURCE_MANIFESTS.find(
    (manifest) => manifest.enabledByDefault,
  );
  if (!crossReferences) {
    throw new Error('No cross-reference source is enabled by default.');
  }
  return { translation: getTranslationManifest(DEFAULT_TRANSLATION_ID), crossReferences };
}

/**
 * Their files, relative to the site's base. The HTML preloads them (see vite/site-head.ts), so they
 * download while the scripts do, instead of after.
 */
export function vizDatasetPaths(): readonly string[] {
  const { translation, crossReferences } = vizDatasets();
  return [translationDatasetPath(translation.id), crossReferencesDatasetPath(crossReferences.id)];
}
