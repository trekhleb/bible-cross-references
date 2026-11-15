import { afterEach, expect, it, vi } from 'vitest';
import { en } from './en.ts';
import { sl } from './sl/ui.ts';
import { connectionCount, t, uiLanguage, verseCount } from './ui.ts';

afterEach(() => vi.unstubAllGlobals());

it('uses the Bible selection for the interface and falls back to English', () => {
  vi.stubGlobal('location', { search: '?t=chr1914-sl' });
  expect(uiLanguage()).toBe('sl');
  expect(t('Bible')).toBe('Sveto pismo');
  expect(connectionCount(2)).toBe('2 povezavi');
  expect(verseCount(3)).toBe('3 vrstice');
  vi.stubGlobal('location', { search: '?t=bsb' });
  expect(uiLanguage()).toBe('en');
  expect(t('Bible')).toBe('Bible');
  expect(connectionCount(1)).toBe('1 connection');
  vi.stubGlobal('location', { search: '?t=chr1914-sl' });
  expect(uiLanguage()).toBe('sl');
  expect(t('Bible')).toBe('Sveto pismo');
  vi.stubGlobal('location', { search: '?t=kjv' });
  expect(uiLanguage()).toBe('en');
  vi.stubGlobal('location', { search: '?t=unknown' });
  expect(uiLanguage()).toBe('en');
});

it('keeps all translations and interpolation placeholders complete', () => {
  expect(Object.keys(sl).sort()).toEqual(Object.keys(en).sort());
  for (const key of Object.keys(en) as (keyof typeof en)[]) {
    expect(sl[key].match(/\{\w+\}/g)?.sort(), key).toEqual(en[key].match(/\{\w+\}/g)?.sort());
    expect(sl[key].trim(), key).not.toBe('');
  }
  expect(t('Translation · {name}', { name: 'Chráska' }, 'sl')).toContain('Chráska');
});
