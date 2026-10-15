import { crossReferencesDatasetPath, translationDatasetPath } from '../../core/datasets/paths.ts';
import { CROSS_REFERENCE_SOURCE_MANIFESTS } from '../../cross-references/registry.ts';
import type { CrossReferenceSourceManifest } from '../../cross-references/source-manifest.ts';
import type { TranslationId } from '../../core/datasets/ids.ts';
import { getTranslationManifest } from '../../translations/registry.ts';
import type { TranslationManifest } from '../../translations/translation-manifest.ts';

/**
 * The datasets the visualizations load: the site's translation (`import.meta.env.TRANSLATION` in
 * the app; the build plugins, which run outside it, pass their own) and the default cross-reference
 * source.
 */
export function vizDatasets(translationId: TranslationId): {
  readonly translation: TranslationManifest;
  readonly crossReferences: CrossReferenceSourceManifest;
} {
  const crossReferences = CROSS_REFERENCE_SOURCE_MANIFESTS.find(
    (manifest) => manifest.enabledByDefault,
  );
  if (!crossReferences) {
    throw new Error('No cross-reference source is enabled by default.');
  }
  return { translation: getTranslationManifest(translationId), crossReferences };
}

/**
 * Their files, relative to the site's base. The HTML preloads them (see vite/site-head.ts), so they
 * download while the scripts do, instead of after.
 */
export function vizDatasetPaths(translationId: TranslationId): readonly string[] {
  const { translation, crossReferences } = vizDatasets(translationId);
  return [translationDatasetPath(translation.id), crossReferencesDatasetPath(crossReferences.id)];
}
