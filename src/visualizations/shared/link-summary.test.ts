import { describe, expect, it } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../core/bible/versification.ts';
import { CrossReferenceIndex } from '../../cross-references/cross-reference-index.ts';
import { createCrossReferenceColumns, verseIndex } from '../../test-utils/fixtures.ts';
import { summarizeLinks } from './link-summary.ts';
import { computeVerseGenres } from './verse-genres.ts';

describe('summarizeLinks', () => {
  it('counts shown links, connected verses and links across the testaments', () => {
    const gen = verseIndex('Gen', 1, 1);
    const ps = verseIndex('Ps', 23, 1);
    const john = verseIndex('John', 1, 1);
    const index = new CrossReferenceIndex(
      createCrossReferenceColumns([
        { from: gen, to: john, toEnd: john + 2 },
        { from: gen, to: ps },
        { from: ps, to: gen },
      ]),
      CANONICAL_VERSIFICATION.verseCount,
    );
    const summary = summarizeLinks(index, [0, 1], computeVerseGenres(CANONICAL_VERSIFICATION));
    expect(summary).toEqual({
      verseCount: 31102,
      shownLinks: 2,
      totalLinks: 3,
      connectedVerses: 5, // Gen 1:1, Ps 23:1 and John 1:1–3
      crossTestamentLinks: 1,
    });
  });
});
