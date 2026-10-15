import type {
  CrossReferencesFile,
  DatasetProvenance,
  TranslationTextFile,
} from '../../src/core/datasets/formats.ts';
import {
  TRANSLATION_IDS,
  type CrossReferenceSourceId,
  type TranslationId,
} from '../../src/core/datasets/ids.ts';
import {
  crossReferencesDatasetPath,
  translationDatasetPath,
} from '../../src/core/datasets/paths.ts';
import { importBsbText } from './importers/bsb.ts';
import { importEsvText } from './importers/esv.ts';
import { importOpenBibleCrossReferences } from './importers/openbible.ts';
import { extractZipTextEntry } from './lib/files.ts';
import type { RawSource } from './lib/sources.ts';

export interface RawSourceContent {
  readonly source: RawSource;
  readonly content: Buffer;
}

/** Reads a verified raw source file by its ID in `data/sources.json`. */
export type RawSourceReader = (sourceId: string) => Promise<RawSourceContent>;

export interface LocalFileContent {
  readonly provenance: DatasetProvenance;
  readonly content: Buffer;
}

/**
 * Reads a raw file that is not in `data/sources.json`: a copyrighted text you supply yourself under
 * `data/raw/`, which is git-ignored and never downloaded.
 */
export type LocalFileReader = (fileName: string) => Promise<LocalFileContent>;

export interface DatasetBuilder {
  /** Output path relative to the site root (written under `public/`). */
  readonly outputPath: string;
  readonly build: (
    readSource: RawSourceReader,
    readLocalFile: LocalFileReader,
  ) => Promise<TranslationTextFile | CrossReferencesFile>;
}

/** The local ESV text (see `data/raw/README.md`). */
export const ESV_FILE_NAME = 'esv.txt';

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
  esv: {
    outputPath: translationDatasetPath('esv'),
    build: async (_readSource, readLocalFile) => {
      const { provenance, content } = await readLocalFile(ESV_FILE_NAME);
      return importEsvText(content.toString('utf8'), provenance);
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

/**
 * The datasets a site showing `translationId` needs: that translation's text (the app loads no
 * other) and every cross-reference source.
 */
export function datasetBuilders(translationId: TranslationId): readonly DatasetBuilder[] {
  return [TRANSLATION_BUILDERS[translationId], ...Object.values(CROSS_REFERENCE_BUILDERS)];
}

/** The other translations' datasets, which must not be left in `public/` to ship with the site. */
export function unusedDatasetPaths(translationId: TranslationId): readonly string[] {
  return TRANSLATION_IDS.filter((id) => id !== translationId).map(translationDatasetPath);
}
