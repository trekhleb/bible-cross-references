import type { CrossReferencesFile, TranslationTextFile } from '../../src/core/datasets/formats.ts';
import type { CrossReferenceSourceId, TranslationId } from '../../src/core/datasets/ids.ts';
import {
  crossReferencesDatasetPath,
  translationDatasetPath,
} from '../../src/core/datasets/paths.ts';
import { importBsbText } from './importers/bsb.ts';
import { importOpenBibleCrossReferences } from './importers/openbible.ts';
import { extractZipTextEntry } from './lib/files.ts';
import type { RawSource } from './lib/sources.ts';

export interface RawSourceContent {
  readonly source: RawSource;
  readonly content: Buffer;
}

/** Reads a verified raw source file by its ID in `data/sources.json`. */
export type RawSourceReader = (sourceId: string) => Promise<RawSourceContent>;

export interface DatasetBuilder {
  /** Output path relative to the site root (written under `public/`). */
  readonly outputPath: string;
  readonly build: (
    readSource: RawSourceReader,
  ) => Promise<TranslationTextFile | CrossReferencesFile>;
}

function provenanceOf({ url, sha256, retrievedAt }: RawSource) {
  return { url, sha256, retrievedAt };
}

/** One builder per translation: the compiler enforces that every translation ID has one. */
const TRANSLATION_BUILDERS: Readonly<Record<TranslationId, DatasetBuilder>> = {
  bsb: {
    outputPath: translationDatasetPath('bsb'),
    build: async (readSource) => {
      const { source, content } = await readSource('bsb');
      return importBsbText(content.toString('utf8'), {
        ...provenanceOf(source),
        snapshotDate: null,
      });
    },
  },
};

/** One builder per cross-reference source. */
const CROSS_REFERENCE_BUILDERS: Readonly<Record<CrossReferenceSourceId, DatasetBuilder>> = {
  openbible: {
    outputPath: crossReferencesDatasetPath('openbible'),
    build: async (readSource) => {
      const { source, content } = await readSource('openbible');
      const text = extractZipTextEntry(content, 'cross_references.txt');
      return importOpenBibleCrossReferences(text, provenanceOf(source));
    },
  },
};

export const DATASET_BUILDERS: readonly DatasetBuilder[] = [
  ...Object.values(TRANSLATION_BUILDERS),
  ...Object.values(CROSS_REFERENCE_BUILDERS),
];
