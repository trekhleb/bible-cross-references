import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadCrossReferences } from '../../cross-references/load-cross-references.ts';
import { CROSS_REFERENCE_SOURCE_MANIFESTS } from '../../cross-references/registry.ts';
import { loadTranslation } from '../../translations/load-translation.ts';
import { getTranslationManifest } from '../../translations/registry.ts';
import { loadOriginalWords } from '../../words/load-original-words.ts';
import { loadWordOccurrences } from '../../words/load-word-occurrences.ts';
import { getWordSourceManifest } from '../../words/registry.ts';
import {
  createCrossReferenceColumns,
  createTranslationFile,
  PROVENANCE,
  verseIndex,
} from '../../test-utils/fixtures.ts';
import { CANONICAL_VERSIFICATION } from '../bible/versification.ts';

const GEN_1_1 = verseIndex('Gen', 1, 1);
const GEN_1_2 = verseIndex('Gen', 1, 2);

/** Answers the next fetch with this file, and reports what was asked for. */
function serve(file: unknown) {
  const fetch = vi.fn<(input: string | URL) => Promise<Response>>(() =>
    Promise.resolve(
      new Response(JSON.stringify(file), {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      }),
    ),
  );
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadTranslation', () => {
  it('builds a translation from its file, and times the work', async () => {
    const fetch = serve(createTranslationFile(new Map([[GEN_1_1, 'In the beginning']])));
    const { translation, report } = await loadTranslation(getTranslationManifest('bsb'));
    expect(translation.verseText(GEN_1_1)).toBe('In the beginning');
    expect(String(fetch.mock.calls[0]?.[0])).toContain('data/translations/bsb.json');
    expect(report.processMs).toBeGreaterThanOrEqual(0);
    expect(report.bytes).toBeGreaterThan(0);
  });

  it('refuses a file that belongs to another translation', async () => {
    serve({ ...createTranslationFile(), translationId: 'kjv' });
    await expect(loadTranslation(getTranslationManifest('bsb'))).rejects.toThrow(/bsb/);
  });
});

describe('loadCrossReferences', () => {
  const [manifest] = CROSS_REFERENCE_SOURCE_MANIFESTS;

  function file() {
    return {
      format: 'cross-references',
      schemaVersion: 1,
      versification: 'kjv',
      provenance: PROVENANCE,
      notices: [],
      sourceId: manifest?.id,
      sourceRowCount: 1,
      links: createCrossReferenceColumns([{ from: GEN_1_1, to: GEN_1_2, votes: 5 }]),
    };
  }

  it('indexes the links it downloads', async () => {
    if (!manifest) {
      throw new Error('Expected a cross-reference source.');
    }
    serve(file());
    const { dataset, report } = await loadCrossReferences(manifest);
    expect(dataset.index.outgoing(GEN_1_1)).toHaveLength(1);
    expect(dataset.sourceRowCount).toBe(1);
    expect(dataset.index.verseCount).toBe(CANONICAL_VERSIFICATION.verseCount);
    expect(report.path).toContain(manifest.id);
  });

  it('refuses a file of the wrong versification', async () => {
    if (!manifest) {
      throw new Error('Expected a cross-reference source.');
    }
    serve({ ...file(), versification: 'lxx' });
    await expect(loadCrossReferences(manifest)).rejects.toThrow();
  });
});

describe('loadOriginalWords', () => {
  const manifest = getWordSourceManifest('stepbible');

  it('indexes the words it downloads', async () => {
    serve({
      format: 'original-words',
      schemaVersion: 1,
      versification: 'kjv',
      provenance: PROVENANCE,
      notices: [],
      sourceId: 'stepbible',
      license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
      attribution: 'Original-language words: STEP Bible (CC BY 4.0).',
      maxVerses: 100,
      words: {
        strongs: ['H7225G'],
        lemma: ['רֵאשִׁית'],
        transliteration: ['reshit'],
        gloss: ['beginning'],
        offsets: [0, 1],
        verses: [GEN_1_1],
      },
    });
    const { dataset } = await loadOriginalWords(manifest);
    expect(dataset.maxVerses).toBe(100);
    expect(dataset.index.wordsOf(GEN_1_1).map((word) => word.strongs)).toEqual(['H7225G']);
  });

  it('refuses a file whose verses are outside the versification', async () => {
    serve({
      format: 'original-words',
      schemaVersion: 1,
      versification: 'kjv',
      provenance: PROVENANCE,
      notices: [],
      sourceId: 'stepbible',
      license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
      attribution: 'Original-language words: STEP Bible (CC BY 4.0).',
      maxVerses: 100,
      words: {
        strongs: ['H7225G'],
        lemma: ['x'],
        transliteration: ['x'],
        gloss: ['x'],
        offsets: [0, 1],
        verses: [999_999],
      },
    });
    await expect(loadOriginalWords(manifest)).rejects.toThrow();
  });
});

describe('loadWordOccurrences', () => {
  const manifest = getWordSourceManifest('stepbible');

  function occurrencesFile(overrides: Record<string, unknown> = {}) {
    return {
      format: 'word-occurrences',
      schemaVersion: 1,
      versification: 'kjv',
      provenance: PROVENANCE,
      notices: [],
      sourceId: 'stepbible',
      license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
      attribution: 'Original-language words: STEP Bible (CC BY 4.0).',
      verseEntries: 2,
      occurrences: {
        grammar: ['HNcfsa', 'V-AAI-3S'],
        grammarAt: [0, 1],
        english: ['beginning', 'loved'],
      },
      ...overrides,
    };
  }

  it('reads how each word is used in each verse', async () => {
    serve(occurrencesFile());
    const occurrences = await loadWordOccurrences(manifest, 2);
    expect(occurrences.useAt(1)).toEqual({ grammar: 'V-AAI-3S', english: 'loved' });
  });

  it('answers with nothing for an entry it does not have', async () => {
    serve(occurrencesFile());
    const occurrences = await loadWordOccurrences(manifest, 2);
    expect(occurrences.useAt(5)).toEqual({ grammar: '', english: '' });
  });

  it('refuses a file built from a different words dataset', async () => {
    serve(occurrencesFile());
    await expect(loadWordOccurrences(manifest, 3)).rejects.toThrow(/different words dataset/);
  });

  it('refuses a file whose columns do not line up', async () => {
    serve(
      occurrencesFile({
        occurrences: { grammar: ['HNcfsa'], grammarAt: [0], english: ['beginning', 'loved'] },
      }),
    );
    await expect(loadWordOccurrences(manifest, 2)).rejects.toThrow();
  });

  it('refuses a grammar index that points nowhere', async () => {
    serve(
      occurrencesFile({
        occurrences: { grammar: ['HNcfsa'], grammarAt: [0, 4], english: ['a', 'b'] },
      }),
    );
    await expect(loadWordOccurrences(manifest, 2)).rejects.toThrow();
  });
});
