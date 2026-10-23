/**
 * The generated datasets, checked as files rather than as builder output.
 *
 * `scripts/data/datasets.test.ts` runs every builder against fixtures, which is where a wiring
 * mistake shows up. It cannot see the scripture: a fixture contains whatever the test wrote into
 * it, so a defect that lives in the real text — a bracket left open across two verses, a licence
 * that never reached the file, a digest naming a file nobody has — passes a green suite.
 *
 * These checks read `public/data/`, which the repository does not carry: it is rebuilt by
 * `npm run data:build`. The unit gate runs beside the build rather than after it (see
 * `.github/workflows/ci.yml`), so the datasets are often absent here and each check stands down
 * for the dataset it cannot find — by name, so the report says what went unchecked rather than
 * the file disappearing whole. `REQUIRE_BUILT_DATASETS=1` turns any absence into a failure, and
 * CI sets it on the job that has them.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../src/core/bible/versification.ts';
import { toOsisId } from '../../src/core/bible/verse-ref.ts';
import { TRANSLATION_IDS, type TranslationId } from '../../src/core/datasets/ids.ts';
import {
  parseOriginalWordsFile,
  parseTranslationTextFile,
  type TranslationTextFile,
} from '../../src/core/datasets/formats.ts';
import { originalWordsDatasetPath, translationDatasetPath } from '../../src/core/datasets/paths.ts';
import { expectRecord, expectString } from '../../src/core/lib/validation.ts';
import { sha256Hex } from './lib/files.ts';
import { MANIFEST_FILE, publicFilePath } from './lib/paths.ts';
import { findSource, readSources } from './lib/sources.ts';

function datasetPath(id: TranslationId): string {
  return publicFilePath(translationDatasetPath(id));
}

const parsed = new Map<TranslationId, TranslationTextFile>();

/** Parsed once: six files of about 4 MB each, read by four checks apiece. */
function load(id: TranslationId): TranslationTextFile {
  const already = parsed.get(id);
  if (already) {
    return already;
  }
  const dataset = parseTranslationTextFile(JSON.parse(readFileSync(datasetPath(id), 'utf8')), {
    id,
    versification: 'kjv',
  });
  parsed.set(id, dataset);
  return dataset;
}

const built = new Set(TRANSLATION_IDS.filter((id) => existsSync(datasetPath(id))));
const required = process.env['REQUIRE_BUILT_DATASETS'] === '1';

describe('the built translation datasets', () => {
  it.runIf(required)('are all present, because REQUIRE_BUILT_DATASETS is set', () => {
    const missing = TRANSLATION_IDS.filter((id) => !built.has(id));
    expect(missing, 'run `npm run data:build` before this job').toEqual([]);
  });

  describe.each(TRANSLATION_IDS)('%s', (id) => {
    /**
     * Every other check here reads a file that may have been built from a different commit, in
     * which case it is answering a question about scripture this tree would not produce. The
     * committed manifest is the build's own record of what it wrote, and `build.ts` fingerprints
     * the very string it writes, so this digest is exact rather than approximate.
     */
    it.runIf(built.has(id))('is the file this tree builds, not a leftover', () => {
      const sitePath = translationDatasetPath(id);
      const lock = expectRecord(JSON.parse(readFileSync(MANIFEST_FILE, 'utf8')), 'the manifest');
      const entry = expectRecord(lock[sitePath], sitePath);
      expect(
        sha256Hex(readFileSync(datasetPath(id))),
        'public/data is stale — run `npm run data:build`',
      ).toBe(expectString(entry['sha256'], `${sitePath}.sha256`));
    });

    it.runIf(built.has(id))('fills every verse slot of the canon', () => {
      expect(load(id).verses).toHaveLength(CANONICAL_VERSIFICATION.verseCount);
    });

    it.runIf(built.has(id))('says whose text it is and under what licence', () => {
      // Written by the importers, optional in the type so that the offline cache can still parse
      // a file from the previous release. Nothing but a check on the built file can require them.
      const dataset = load(id);
      expect(dataset.license?.name, 'licence name').toBeTruthy();
      expect(dataset.license?.url, 'licence url').toBeTruthy();
      expect(dataset.attribution, 'credit').toBeTruthy();
    });

    it.runIf(built.has(id))('closes every bracket in the verse that opened it', () => {
      const offenders: string[] = [];
      load(id).verses.forEach((text, index) => {
        let depth = 0;
        for (const character of text) {
          if (character === '[') {
            depth += 1;
          } else if (character === ']') {
            depth -= 1;
          }
          if (depth < 0) {
            break;
          }
        }
        if (depth !== 0) {
          offenders.push(toOsisId(CANONICAL_VERSIFICATION.refAt(index)));
        }
      });
      expect(offenders, 'a bracket reaches the reader with nothing closing it').toEqual([]);
    });

    it.runIf(built.has(id))('publishes the digest of the file the build verified', async () => {
      // `provenance.sha256` is the one number a reader could check the scripture with: download
      // what `provenance.url` names and hash it. A digest of anything else — an intermediate, a
      // file on whoever prepared the text's own machine — points at nothing, and being 64 valid
      // hex characters does not make it checkable. `data/sources.json` is committed, so this
      // comparison is available wherever the datasets are.
      const dataset = load(id);
      const pin = findSource(await readSources(), id);
      expect(dataset.provenance.sha256, 'provenance digest').toBe(pin.sha256);
      expect(dataset.provenance.url, 'provenance url').toBe(pin.url);
      expect(dataset.provenance.retrievedAt, 'retrieval date').toBe(pin.retrievedAt);
    });
  });
});

/**
 * The Polish glosses are a translation of the English ones, kept in the tree rather than built,
 * so nothing in the pipeline would notice the two drifting apart when STEPBible is re-pinned:
 * a new word would quietly show its English gloss to a Polish reader. This is where they meet.
 */
describe('the Polish glosses', () => {
  const wordsPath = publicFilePath(originalWordsDatasetPath('stepbible'));
  const present = existsSync(wordsPath);

  it.runIf(present)(
    'give every word of the built dataset a Polish gloss, shaped like its English one',
    () => {
      const words = parseOriginalWordsFile(JSON.parse(readFileSync(wordsPath, 'utf8')), {
        id: 'stepbible',
        versification: 'kjv',
      }).words;
      const polish = expectRecord(
        JSON.parse(readFileSync('src/words/glosses/pl.json', 'utf8')),
        'src/words/glosses/pl.json',
      );
      const problems: string[] = [];
      words.strongs.forEach((strongs, index) => {
        const english = words.gloss[index] ?? '';
        const entry = polish[strongs];
        const translated = typeof entry === 'string' ? entry : undefined;
        if (translated === undefined || translated.trim() === '') {
          problems.push(`${strongs}: no Polish gloss for “${english}”`);
        } else if (translated.split(' / ').length !== english.split(' / ').length) {
          problems.push(
            `${strongs}: “${english}” has a different number of senses in “${translated}”`,
          );
        }
      });
      expect(problems).toEqual([]);
    },
  );
});
