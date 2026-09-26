import { CANONICAL_VERSIFICATION } from '../core/bible/versification.ts';
import { parseTranslationTextFile } from '../core/datasets/formats.ts';
import { translationDatasetPath } from '../core/datasets/paths.ts';
import { fetchDataset, measure, type DatasetLoadReport } from '../shared/lib/fetch-dataset.ts';
import { Translation } from './translation.ts';
import type { TranslationManifest } from './translation-manifest.ts';

export interface LoadedTranslation {
  readonly translation: Translation;
  readonly report: DatasetLoadReport;
}

export async function loadTranslation(manifest: TranslationManifest): Promise<LoadedTranslation> {
  const { json, report } = await fetchDataset(translationDatasetPath(manifest.id));
  const { value: translation, ms } = measure(() => {
    const file = parseTranslationTextFile(json, {
      id: manifest.id,
      versification: CANONICAL_VERSIFICATION.id,
    });
    return new Translation(manifest, CANONICAL_VERSIFICATION, file);
  });
  return { translation, report: { ...report, processMs: ms } };
}
