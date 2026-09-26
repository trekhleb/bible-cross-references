import { CANONICAL_VERSIFICATION } from '../core/bible/versification.ts';
import {
  parseCrossReferencesFile,
  type DatasetProvenance,
  type ImportNotice,
} from '../core/datasets/formats.ts';
import { crossReferencesDatasetPath } from '../core/datasets/paths.ts';
import { fetchDataset, measure, type DatasetLoadReport } from '../shared/lib/fetch-dataset.ts';
import { CrossReferenceIndex } from './cross-reference-index.ts';
import type { CrossReferenceSourceManifest } from './source-manifest.ts';

export interface CrossReferenceDataset {
  readonly manifest: CrossReferenceSourceManifest;
  readonly provenance: DatasetProvenance;
  readonly notices: readonly ImportNotice[];
  /** Number of data rows in the raw source file. */
  readonly sourceRowCount: number;
  readonly index: CrossReferenceIndex;
}

export interface LoadedCrossReferences {
  readonly dataset: CrossReferenceDataset;
  readonly report: DatasetLoadReport;
}

export async function loadCrossReferences(
  manifest: CrossReferenceSourceManifest,
): Promise<LoadedCrossReferences> {
  const { json, report } = await fetchDataset(crossReferencesDatasetPath(manifest.id));
  const { value: dataset, ms } = measure((): CrossReferenceDataset => {
    const file = parseCrossReferencesFile(json, {
      id: manifest.id,
      versification: CANONICAL_VERSIFICATION.id,
    });
    return {
      manifest,
      provenance: file.provenance,
      notices: file.notices,
      sourceRowCount: file.sourceRowCount,
      index: new CrossReferenceIndex(file.links, CANONICAL_VERSIFICATION.verseCount),
    };
  });
  return { dataset, report: { ...report, processMs: ms } };
}
