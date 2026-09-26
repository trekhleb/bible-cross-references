import { describe, expect, it } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../core/bible/versification.ts';
import { CrossReferenceIndex } from '../../cross-references/cross-reference-index.ts';
import { createCrossReferenceColumns, verseIndex } from '../../test-utils/fixtures.ts';
import { createLinkFilter, isDefaultFilter, selectLinks } from './link-filter.ts';
import { computeVerseGenres } from './verse-genres.ts';

const verseGenres = computeVerseGenres(CANONICAL_VERSIFICATION);
const GEN = verseIndex('Gen', 1, 1);
const PS = verseIndex('Ps', 23, 1);
const JOHN = verseIndex('John', 1, 1);

const index = new CrossReferenceIndex(
  createCrossReferenceColumns([
    { from: GEN, to: JOHN, votes: 12 },
    { from: GEN, to: PS, votes: -3 },
    { from: PS, to: JOHN, votes: 4 },
  ]),
  CANONICAL_VERSIFICATION.verseCount,
);

describe('selectLinks', () => {
  it('keeps links at or above the vote threshold', () => {
    expect(selectLinks(index, verseGenres, createLinkFilter(-Infinity)).length).toBe(3);
    expect(selectLinks(index, verseGenres, createLinkFilter(0)).length).toBe(2);
    expect(selectLinks(index, verseGenres, createLinkFilter(10)).length).toBe(1);
  });

  it('hides links that touch a hidden genre at either end', () => {
    const filter = { minVotes: -Infinity, hiddenGenres: new Set(['poetry'] as const) };
    const ids = selectLinks(index, verseGenres, filter);
    expect(Array.from(ids, (id) => index.link(id).votes)).toEqual([12]);
  });
});

describe('isDefaultFilter', () => {
  it('compares against the defaults', () => {
    const defaults = createLinkFilter(5);
    expect(isDefaultFilter(createLinkFilter(5), defaults)).toBe(true);
    expect(isDefaultFilter(createLinkFilter(1), defaults)).toBe(false);
    expect(isDefaultFilter({ minVotes: 5, hiddenGenres: new Set(['acts']) }, defaults)).toBe(false);
  });
});
