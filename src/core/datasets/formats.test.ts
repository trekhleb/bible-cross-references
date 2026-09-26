import { describe, expect, it } from 'vitest';
import { createCrossReferenceColumns, createTranslationFile } from '../../test-utils/fixtures.ts';
import { parseCrossReferencesFile, parseTranslationTextFile } from './formats.ts';

const roundTrip = (value: unknown): unknown => JSON.parse(JSON.stringify(value));

describe('dataset file parsing', () => {
  it('accepts a valid translation file', () => {
    const file = createTranslationFile();
    expect(parseTranslationTextFile(roundTrip(file), { id: 'bsb', versification: 'kjv' })).toEqual(
      file,
    );
  });

  it('rejects files from another schema version', () => {
    const file = { ...createTranslationFile(), schemaVersion: 2 };
    expect(() =>
      parseTranslationTextFile(roundTrip(file), { id: 'bsb', versification: 'kjv' }),
    ).toThrow('schemaVersion: expected one of 1, got 2');
  });

  it('accepts a valid cross-reference file', () => {
    const file = {
      format: 'cross-references',
      schemaVersion: 1,
      versification: 'kjv',
      provenance: {
        url: 'https://example.org',
        sha256: 'a'.repeat(64),
        retrievedAt: '2026-01-01',
        snapshotDate: '2026-01-01',
      },
      notices: [{ level: 'info', message: 'Remapped', count: 1, examples: ['x'] }],
      sourceId: 'openbible',
      sourceRowCount: 1,
      links: createCrossReferenceColumns([{ from: 0, to: 1, votes: 3 }], 2),
    };
    expect(
      parseCrossReferencesFile(roundTrip(file), { id: 'openbible', versification: 'kjv' }),
    ).toEqual(file);
  });

  it('rejects malformed link columns', () => {
    expect(() =>
      parseCrossReferencesFile(
        {
          format: 'cross-references',
          schemaVersion: 1,
          versification: 'kjv',
          provenance: {
            url: '',
            sha256: '',
            retrievedAt: '',
            snapshotDate: null,
          },
          notices: [],
          sourceId: 'openbible',
          sourceRowCount: 0,
          links: { offsets: [0], targetStart: [], targetEnd: [], votes: ['1'] },
        },
        { id: 'openbible', versification: 'kjv' },
      ),
    ).toThrow('links.votes[0]: expected an integer');
  });
});
