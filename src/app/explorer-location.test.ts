import { describe, expect, it, vi } from 'vitest';
import { versePassage, type Passage } from '../core/bible/passage.ts';
import { KJV_VERSIFICATION as kjv } from '../core/bible/versification.ts';
import { DEFAULT_TRANSLATION_ID } from '../translations/registry.ts';
import {
  createLinkFilter,
  DEFAULT_LINK_FILTER,
  type LinkFilter,
} from '../visualizations/shared/link-filter.ts';
import {
  explorerUrl,
  parseExplorerUrl,
  plainTranslationFor,
  type ViewRoute,
} from './explorer-location.ts';

const ROUTES: readonly [ViewRoute<'arcs'>, ViewRoute<'threads'>] = [
  { id: 'arcs', path: '' },
  { id: 'threads', path: 'threads/' },
];
const JOHN_3_16 = versePassage(kjv.indexOf({ book: 'John', chapter: 3, verse: 16 }) ?? -1);
const ISAIAH_53: Passage = { kind: 'chapter', book: 'Isa', chapter: 53 };

function parse(url: string, base = '/', preferred = DEFAULT_TRANSLATION_ID) {
  return parseExplorerUrl(
    new URL(url, 'https://example.org'),
    base,
    ROUTES,
    kjv,
    () => preferred,
    'en',
  );
}

/** A location's view and passage, for tests that don't look at the filter. */
function place(url: string, base = '/') {
  const { view, passage } = parse(url, base);
  return { view, passage };
}

const HIDE_LAW_AND_HISTORY: LinkFilter = {
  minVotes: 10,
  hiddenGenres: new Set(['law', 'history'] as const),
};

describe('parseExplorerUrl', () => {
  it('reads the home view without a passage', () => {
    expect(place('/')).toEqual({ view: 'arcs', passage: null });
  });

  it('reads the view from the path and the passage from ?ref=', () => {
    expect(place('/threads/?ref=John.3.16')).toEqual({ view: 'threads', passage: JOHN_3_16 });
    expect(place('/?ref=Isa.53')).toEqual({ view: 'arcs', passage: ISAIAH_53 });
  });

  it('accepts the page path without its trailing slash or with index.html', () => {
    expect(parse('/threads').view).toBe('threads');
    expect(parse('/threads/index.html').view).toBe('threads');
    expect(parse('/index.html').view).toBe('arcs');
  });

  it('resolves paths against the site base', () => {
    expect(
      place('/bible-cross-references/threads/?ref=Isa.53', '/bible-cross-references/'),
    ).toEqual({
      view: 'threads',
      passage: ISAIAH_53,
    });
    expect(parse('/bible-cross-references/', '/bible-cross-references/').view).toBe('arcs');
  });

  it('falls back to the home view and no passage for unknown values', () => {
    expect(place('/elsewhere/?ref=Nope.1.1')).toEqual({ view: 'arcs', passage: null });
  });

  it('reads the filter: the vote threshold and the hidden genres', () => {
    expect(parse('/').filter).toEqual(DEFAULT_LINK_FILTER);
    expect(parse('/?votes=10&hide=history,law').filter).toEqual(HIDE_LAW_AND_HISTORY);
    expect(parse('/?votes=all').filter.minVotes).toBe(-Infinity);
  });

  it('reads the translation from ?t=, falling back to the one the reader chose', () => {
    expect(parse('/?t=kjv').translation).toBe('kjv');
    expect(parse('/').translation).toBe(DEFAULT_TRANSLATION_ID);
    expect(parse('/', '/', 'kjv').translation).toBe('kjv');
    // A URL that names a translation wins over the reader's own choice.
    expect(parse('/?t=bsb', '/', 'kjv').translation).toBe('bsb');
    // One the app does not have is ignored rather than shown as an empty page.
    expect(parse('/?t=nope', '/', 'kjv').translation).toBe('kjv');
  });

  it('keeps the default filter for unknown thresholds and genres', () => {
    expect(parse('/?votes=7').filter.minVotes).toBe(DEFAULT_LINK_FILTER.minVotes);
    expect(parse('/?votes=many').filter.minVotes).toBe(DEFAULT_LINK_FILTER.minVotes);
    expect([...parse('/?hide=law,nope').filter.hiddenGenres]).toEqual(['law']);
  });
});

describe('explorerUrl', () => {
  it('builds the page path with the passage as ?ref=', () => {
    const plain = {
      passage: null,
      filter: DEFAULT_LINK_FILTER,
      translation: DEFAULT_TRANSLATION_ID,
      locale: 'en',
    } as const;
    expect(explorerUrl(ROUTES[0], plain, '/', kjv)).toBe('/');
    expect(
      explorerUrl(ROUTES[1], { ...plain, passage: JOHN_3_16 }, '/bible-cross-references/', kjv),
    ).toBe('/bible-cross-references/threads/?ref=John.3.16');
  });

  it('adds the filter only when it differs from the default, genres in canonical order', () => {
    const url = explorerUrl(
      ROUTES[0],
      {
        passage: ISAIAH_53,
        filter: HIDE_LAW_AND_HISTORY,
        translation: DEFAULT_TRANSLATION_ID,
        locale: 'en',
      },
      '/',
      kjv,
    );
    expect(url).toBe('/?ref=Isa.53&votes=10&hide=law,history');
    const all = explorerUrl(
      ROUTES[0],
      {
        passage: null,
        filter: createLinkFilter(-Infinity),
        translation: DEFAULT_TRANSLATION_ID,
        locale: 'en',
      },
      '/',
      kjv,
    );
    expect(all).toBe('/?votes=all');
  });

  it('names the translation unless it is the default, so a shared link keeps it', () => {
    const passage = { passage: JOHN_3_16, filter: DEFAULT_LINK_FILTER, locale: 'en' } as const;
    expect(explorerUrl(ROUTES[0], { ...passage, translation: 'bsb' }, '/', kjv)).toBe(
      '/?ref=John.3.16',
    );
    expect(explorerUrl(ROUTES[0], { ...passage, translation: 'kjv' }, '/', kjv)).toBe(
      '/?ref=John.3.16&t=kjv',
    );
    // Even for a reader whose own choice is the KJV: the link has to read as they read it.
    expect(
      parse(explorerUrl(ROUTES[0], { ...passage, translation: 'kjv' }, '/', kjv)).translation,
    ).toBe('kjv');
  });

  it('always names the translation for a link meant for someone else', () => {
    const quoted = {
      passage: JOHN_3_16,
      filter: DEFAULT_LINK_FILTER,
      translation: DEFAULT_TRANSLATION_ID,
      locale: 'en',
    } as const;
    // A quote of the default translation has to open in it, whatever its reader usually reads.
    expect(explorerUrl(ROUTES[0], quoted, '/', kjv, null)).toBe('/?ref=John.3.16&t=bsb');
    expect(parse('/?ref=John.3.16&t=bsb', '/', 'kjv').translation).toBe('bsb');
  });

  it('keeps a URL on the text it shows, whichever translation the reader prefers', () => {
    // Someone who usually reads the KJV, following a link into the BSB: every link the app then
    // builds has to carry the BSB, or going back or reloading would switch the text under them.
    const reading = {
      passage: JOHN_3_16,
      filter: DEFAULT_LINK_FILTER,
      translation: 'bsb',
      locale: 'en',
    } as const;
    const url = explorerUrl(ROUTES[0], reading, '/', kjv, plainTranslationFor('kjv'));
    expect(url).toBe('/?ref=John.3.16&t=bsb');
    expect(parse(url, '/', 'kjv').translation).toBe('bsb');
    // While a reader is on their own translation, their links stay plain.
    expect(plainTranslationFor('bsb')).toBe('bsb');
    expect(plainTranslationFor('kjv')).toBeNull();
  });

  it('round-trips through parseExplorerUrl', () => {
    const location = {
      passage: ISAIAH_53,
      filter: HIDE_LAW_AND_HISTORY,
      translation: DEFAULT_TRANSLATION_ID,
      locale: 'en',
    } as const;
    expect(parse(explorerUrl(ROUTES[1], location, '/', kjv))).toEqual({
      view: 'threads',
      ...location,
    });
  });
});

it('preserves the selected draft when navigating to another chapter', () => {
  vi.stubGlobal('location', { search: '?t=chr1914-sl' });
  try {
    expect(
      explorerUrl(
        ROUTES[1],
        {
          passage: ISAIAH_53,
          filter: DEFAULT_LINK_FILTER,
          locale: 'en',
          translation: 'chr1914-sl',
        },
        '/',
        kjv,
      ),
    ).toBe('/threads/?ref=Isa.53&t=chr1914-sl');
  } finally {
    vi.unstubAllGlobals();
  }
});
