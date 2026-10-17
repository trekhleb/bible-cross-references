import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { CANONICAL_VERSIFICATION } from '../../../src/core/bible/versification.ts';
import { parseTranslationTextFile } from '../../../src/core/datasets/formats.ts';
import { selectedTranslation } from '../../../src/translations/selection.ts';
import { getTranslationManifest } from '../../../src/translations/registry.ts';
import { Translation } from '../../../src/translations/translation.ts';
import { verseTextOrNote } from '../../../src/translations/verse-text.ts';

const file = parseTranslationTextFile(
  JSON.parse(
    readFileSync(new URL('../../../data/raw/chr1914-sl.draft.json', import.meta.url), 'utf8'),
  ),
  { id: 'chr1914-sl', versification: 'kjv' },
);
const translation = new Translation(
  getTranslationManifest('chr1914-sl'),
  CANONICAL_VERSIFICATION,
  file,
);

describe('Slovenian local preview', () => {
  it('loads the actual converted Genesis text in the canonical slots', () => {
    expect(translation.verseCount).toBe(31102);
    expect(translation.verseText(0)).toBe('V začetku je ustvaril Bog nebesa in zemljo.');
    expect(translation.search('V začetku je ustvaril', 5).verses).toContain(0);
  });
  it('loads all Exodus slots and keeps repaired boundaries in the right positions', () => {
    expect(file.verses.slice(1533, 1533 + 1213).every(Boolean)).toBe(true);
    for (const [chapter, verse, prefix] of [
      [6, 1, 'In Gospod reče Mojzesu: Sedaj'],
      [8, 1, 'Tedaj reče Gospod Mojzesu:'],
      [20, 10, 'ali sedmi dan je čas počitka'],
      [20, 11, 'Zakaj v šestih dneh'],
      [22, 1, 'Če kdo ukrade vola'],
      [40, 38, 'Zakaj oblak Gospodov'],
    ] as const) {
      const index = CANONICAL_VERSIFICATION.indexOf({ book: 'Exod', chapter, verse });
      expect(index).toBeDefined();
      if (index !== undefined)
        expect(translation.verseText(index)).toMatch(new RegExp(`^${prefix}`));
    }
    expect(file.verses.filter(Boolean).length).toBe(translation.manifest.previewVerseCount);
  });
  it('loads all Leviticus verses and preserves reviewed historical forms', () => {
    expect(file.verses.slice(2746, 3605).every(Boolean)).toBe(true);
    for (const [chapter, verse, fragment] of [
      [3, 4, 'ledici'],
      [6, 1, 'In Gospod je govoril Mojzesu'],
      [19, 14, 'temuč'],
      [21, 1, 'sinovim'],
      [24, 19, 'provzroči'],
    ] as const) {
      const index = CANONICAL_VERSIFICATION.indexOf({ book: 'Lev', chapter, verse });
      expect(index).toBeDefined();
      if (index !== undefined) expect(translation.verseText(index)).toContain(fragment);
    }
  });
  it('distinguishes unresolved OCR slots from manuscript omissions, in the display', () => {
    const index = 1;
    const verses = [...file.verses];
    verses[index] = '';
    const incomplete = new Translation(
      getTranslationManifest('chr1914-sl'),
      CANONICAL_VERSIFICATION,
      { ...file, verses },
    );
    expect(incomplete.isOmitted(index)).toBe(false);
    expect(incomplete.textOrNote(index)).toContain('preverjanje OCR');
    expect(verseTextOrNote(incomplete, index)).toBe(incomplete.textOrNote(index));
  });
  it('loads all books and preserves explicitly mapped split and merged verses', () => {
    expect(file.verses).toHaveLength(31102);
    expect(file.verses.every(Boolean)).toBe(true);
    for (const [book, chapter, verse, prefix] of [
      ['Ps', 13, 6, 'prepeval bom Gospodu'],
      ['Isa', 64, 1, 'O da bi predrl nebesa'],
      ['Acts', 19, 41, 'In rekši to,'],
      ['2Cor', 13, 13, 'Pozdravljajo vas vsi sveti.'],
      ['Rev', 13, 1, 'In postavi se na pesku morskem.'],
    ] as const) {
      const index = CANONICAL_VERSIFICATION.indexOf({ book, chapter, verse });
      expect(index).toBeDefined();
      if (index !== undefined)
        expect(translation.verseText(index)).toMatch(new RegExp(`^${prefix}`));
    }
  });
  it('keeps English as the default and handles unknown selections', () => {
    expect(selectedTranslation('').id).toBe('bsb');
    expect(selectedTranslation('?t=unknown').id).toBe('bsb');
    expect(selectedTranslation('?t=chr1914-sl').language).toBe('sl');
  });
});
