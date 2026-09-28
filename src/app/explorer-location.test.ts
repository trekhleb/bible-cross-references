import { describe, expect, it } from 'vitest';
import { versePassage, type Passage } from '../core/bible/passage.ts';
import { KJV_VERSIFICATION as kjv } from '../core/bible/versification.ts';
import {
  createLinkFilter,
  DEFAULT_LINK_FILTER,
  type LinkFilter,
} from '../visualizations/shared/link-filter.ts';
import { explorerUrl, parseExplorerUrl, type ViewRoute } from './explorer-location.ts';

const ROUTES: readonly [ViewRoute<'arcs'>, ViewRoute<'threads'>] = [
  { id: 'arcs', path: '' },
  { id: 'threads', path: 'threads/' },
];
const JOHN_3_16 = versePassage(kjv.indexOf({ book: 'John', chapter: 3, verse: 16 }) ?? -1);
const ISAIAH_53: Passage = { kind: 'chapter', book: 'Isa', chapter: 53 };

function parse(url: string, base = '/') {
  return parseExplorerUrl(new URL(url, 'https://example.org'), base, ROUTES, kjv);
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

  it('keeps the default filter for unknown thresholds and genres', () => {
    expect(parse('/?votes=7').filter.minVotes).toBe(DEFAULT_LINK_FILTER.minVotes);
    expect(parse('/?votes=many').filter.minVotes).toBe(DEFAULT_LINK_FILTER.minVotes);
    expect([...parse('/?hide=law,nope').filter.hiddenGenres]).toEqual(['law']);
  });
});

describe('explorerUrl', () => {
  it('builds the page path with the passage as ?ref=', () => {
    const plain = { passage: null, filter: DEFAULT_LINK_FILTER };
    expect(explorerUrl(ROUTES[0], plain, '/', kjv)).toBe('/');
    expect(
      explorerUrl(ROUTES[1], { ...plain, passage: JOHN_3_16 }, '/bible-cross-references/', kjv),
    ).toBe('/bible-cross-references/threads/?ref=John.3.16');
  });

  it('adds the filter only when it differs from the default, genres in canonical order', () => {
    const url = explorerUrl(
      ROUTES[0],
      { passage: ISAIAH_53, filter: HIDE_LAW_AND_HISTORY },
      '/',
      kjv,
    );
    expect(url).toBe('/?ref=Isa.53&votes=10&hide=law,history');
    const all = explorerUrl(
      ROUTES[0],
      { passage: null, filter: createLinkFilter(-Infinity) },
      '/',
      kjv,
    );
    expect(all).toBe('/?votes=all');
  });

  it('round-trips through parseExplorerUrl', () => {
    const location = { passage: ISAIAH_53, filter: HIDE_LAW_AND_HISTORY };
    expect(parse(explorerUrl(ROUTES[1], location, '/', kjv))).toEqual({
      view: 'threads',
      ...location,
    });
  });
});
