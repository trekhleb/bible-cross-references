import { describe, expect, it } from 'vitest';
import { parseOsisId } from '../../../src/core/bible/verse-ref.ts';
import { CANONICAL_VERSIFICATION } from '../../../src/core/bible/versification.ts';
import { TRANSLATION_IDS } from '../../../src/core/datasets/ids.ts';
import { defectsFor, SOURCE_DEFECTS } from './source-defects.ts';

describe('SOURCE_DEFECTS', () => {
  it('names a verse that exists, for every entry', () => {
    // A typo here would be silent in the worst way: the entry matches nothing, the defect it
    // describes still ships, and the list reads as though it had been handled.
    for (const { verse } of SOURCE_DEFECTS) {
      const ref = parseOsisId(verse);
      expect(ref, verse).toBeDefined();
      expect(ref && CANONICAL_VERSIFICATION.indexOf(ref), verse).toBeDefined();
    }
  });

  it('removes something, and says why, for every entry', () => {
    for (const defect of SOURCE_DEFECTS) {
      expect(defect.remove.length, defect.verse).toBeGreaterThan(0);
      // The reason is the whole point of a list over a pattern: a reviewer has to be able to
      // judge the removal without going to the source file.
      expect(defect.because.length, defect.verse).toBeGreaterThan(40);
    }
  });

  it('names a translation the project has', () => {
    for (const { translationId, verse } of SOURCE_DEFECTS) {
      expect(TRANSLATION_IDS, verse).toContain(translationId);
    }
  });

  it('corrects each verse once, so two entries cannot fight over one verse', () => {
    const keys = SOURCE_DEFECTS.map(({ translationId, verse }) => `${translationId}/${verse}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('groups by translation, and gives nothing for one with no defects', () => {
    expect([...defectsFor('riveduta1927').keys()].toSorted()).toEqual([
      '2Sam.20.26',
      'Matt.20.34',
      'Matt.3.17',
      'Matt.5.48',
    ]);
    expect(defectsFor('luther1912').get('Judg.11.25')?.remove).toBe(' 518heeft');
    expect(defectsFor('bsb').size).toBe(0);
    expect(defectsFor('kjv').size).toBe(0);
    expect(defectsFor('vbl').size).toBe(0);
    expect(defectsFor('ubg').size).toBe(0);
  });
});
