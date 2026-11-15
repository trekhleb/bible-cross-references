import { parseTranslationTextFile } from '../../src/core/datasets/formats.ts';
import type {
  CrossReferencesFile,
  OriginalWordsFile,
  TranslationTextFile,
} from '../../src/core/datasets/formats.ts';
import type {
  CrossReferenceSourceId,
  TranslationId,
  WordSourceId,
} from '../../src/core/datasets/ids.ts';

import {
  crossReferencesDatasetPath,
  originalWordsDatasetPath,
  translationDatasetPath,
} from '../../src/core/datasets/paths.ts';
import { importBsbText } from './importers/bsb.ts';
import { importEbibleVerseLines } from './importers/ebible-vpl.ts';
import { importOpenBibleCrossReferences } from './importers/openbible.ts';
import { getWordSourceManifest } from '../../src/words/registry.ts';
import { importStepBibleWords, type TaggedLanguage } from './importers/stepbible.ts';
import { expectMember } from './lib/sources.ts';
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
  ) => Promise<TranslationTextFile | CrossReferencesFile | OriginalWordsFile>;
}

function provenanceOf({ url, sha256, retrievedAt }: RawSource) {
  return { url, sha256, retrievedAt };
}

/**
 * A translation published by eBible.org as a verse-per-line archive, which is most of them.
 *
 * The entry to read comes from the pin rather than being repeated here: naming a different one
 * would mean the digest guarded a file the build never reads, and the scripture would ship
 * unverified with nothing to say so.
 *
 * `snapshotDate` is null for all of these. eBible does date each archive, in an `_about.htm`
 * beside the text — but the pin covers only the verse file, so that date is not part of what the
 * build verifies and recording it would imply a check nothing performs. What identifies the copy
 * here is the digest and `retrievedAt`. A translation whose licence requires the edition's date
 * to travel with the text (as the Bíblia Livre's does) needs the date pinned, not read in
 * passing, and so does not belong in this helper.
 *
 * The source in `data/sources.json` carries the translation's own id, so there is one name to
 * get wrong rather than two.
 */
function ebibleTranslation(id: TranslationId): DatasetBuilder {
  return {
    outputPath: translationDatasetPath(id),
    build: async (readSource) => {
      const { source, content } = await readSource(id);
      const text = extractZipTextEntry(content, expectMember(source));
      return importEbibleVerseLines(text, id, { ...provenanceOf(source), snapshotDate: null });
    },
  };
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
  kjv: ebibleTranslation('kjv'),
  blivre: {
    outputPath: translationDatasetPath('blivre'),
    build: async (readSource) => {
      const { source, content } = await readSource('blivre');
      const text = extractZipTextEntry(content, 'bliv-tr_vpl.txt');
      return importEbibleVerseLines(text, 'blivre', {
        ...provenanceOf(source),
        // The translators ask that the edition's date always travel with the text, and the
        // release this is pinned to is the February 2018 one.
        snapshotDate: '2018-02-25',
      });
    },
  },
  luther1912: ebibleTranslation('luther1912'),
  riveduta1927: ebibleTranslation('riveduta1927'),
  vbl: ebibleTranslation('vbl'),
  'chr1914-sl': {
    outputPath: translationDatasetPath('chr1914-sl'),
    build: async (readSource) => {
      const { content } = await readSource('chr1914-sl');
      return parseTranslationTextFile(JSON.parse(content.toString('utf8')), {
        id: 'chr1914-sl',
        versification: 'kjv',
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

/**
 * The tagged Hebrew and Greek: six files of words and two lexicons, from which only the
 * dictionary forms and the verses they occur in are kept.
 */
const TAGGED_SOURCES: readonly { readonly id: string; readonly language: TaggedLanguage }[] = [
  { id: 'stepbible-tahot-gen-deu', language: 'hebrew' },
  { id: 'stepbible-tahot-jos-est', language: 'hebrew' },
  { id: 'stepbible-tahot-job-sng', language: 'hebrew' },
  { id: 'stepbible-tahot-isa-mal', language: 'hebrew' },
  { id: 'stepbible-tagnt-mat-jhn', language: 'greek' },
  { id: 'stepbible-tagnt-act-rev', language: 'greek' },
];

const LEXICON_SOURCES: readonly { readonly id: string; readonly language: TaggedLanguage }[] = [
  { id: 'stepbible-tbesh', language: 'hebrew' },
  { id: 'stepbible-tbesg', language: 'greek' },
];

/**
 * A word used in more verses than this says nothing about the verse it is in, and the pairs for
 * it would outweigh every other word together (a third of the data, against two thirds for the
 * 577 commonest words).
 */
const MAX_VERSES_PER_WORD = 100;

const WORD_BUILDERS: Readonly<Record<WordSourceId, DatasetBuilder>> = {
  stepbible: {
    outputPath: originalWordsDatasetPath('stepbible'),
    build: async (readSource) => {
      const read = async ({ id, language }: { id: string; language: TaggedLanguage }) => {
        const { source, content } = await readSource(id);
        return { source, language, text: content.toString('utf8') };
      };
      const files = await Promise.all(TAGGED_SOURCES.map(read));
      const lexicons = await Promise.all(LEXICON_SOURCES.map(read));
      const first = files[0];
      if (!first) {
        throw new Error('No tagged sources are configured.');
      }
      const manifest = getWordSourceManifest('stepbible');
      return importStepBibleWords(files, lexicons, {
        maxVerses: MAX_VERSES_PER_WORD,
        license: manifest.license,
        attribution: manifest.attribution,
        // Every file is pinned; the first stands for the set in the dataset's provenance, and
        // the rest are listed beside it in data/sources.json.
        provenance: provenanceOf(first.source),
      });
    },
  },
};

export const DATASET_BUILDERS: readonly DatasetBuilder[] = [
  ...Object.values(TRANSLATION_BUILDERS),
  ...Object.values(CROSS_REFERENCE_BUILDERS),
  ...Object.values(WORD_BUILDERS),
];
