import type { CrossReferenceSourceId, TranslationId } from './ids.ts';

/**
 * Location of generated dataset files, relative to the site root. The data pipeline writes them
 * under `public/`, from where they are served as static assets.
 */
export const DATASETS_DIRECTORY = 'data';

export function translationDatasetPath(id: TranslationId): string {
  return `${DATASETS_DIRECTORY}/translations/${id}.json`;
}

export function crossReferencesDatasetPath(id: CrossReferenceSourceId): string {
  return `${DATASETS_DIRECTORY}/cross-references/${id}.json`;
}
