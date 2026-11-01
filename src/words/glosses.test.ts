import { describe, expect, it } from 'vitest';
import { hasOwnGlosses, loadGlosses, localizedGloss } from './glosses.ts';

describe('localizedGloss', () => {
  const word = { strongs: 'G0026', gloss: 'love' };

  it('gives the reader’s own gloss where the language has one', () => {
    expect(localizedGloss(word, { G0026: 'miłość' })).toBe('miłość');
  });

  it('keeps the English gloss for a word the table leaves out', () => {
    expect(localizedGloss(word, { G0027: 'umiłowany' })).toBe('love');
  });

  it('keeps the English gloss while the table has not arrived', () => {
    expect(localizedGloss(word, null)).toBe('love');
  });
});

describe('loadGlosses', () => {
  it('has no table for a language that reads the English glosses', async () => {
    expect(hasOwnGlosses('de')).toBe(false);
    await expect(loadGlosses('de')).resolves.toBeNull();
  });

  it('loads the Polish table once and hands back the same one after', async () => {
    expect(hasOwnGlosses('pl')).toBe(true);
    const first = await loadGlosses('pl');
    expect(first).not.toBeNull();
    expect(await loadGlosses('pl')).toBe(first);
  });
});
