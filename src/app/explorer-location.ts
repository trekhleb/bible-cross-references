import { GENRES } from '../core/bible/genres.ts';
import { parsePassageOsisId, toPassageOsisId, type Passage } from '../core/bible/passage.ts';
import type { Versification } from '../core/bible/versification.ts';
import {
  DEFAULT_LINK_FILTER,
  VOTE_THRESHOLDS,
  type LinkFilter,
} from '../visualizations/shared/link-filter.ts';

/** URL query parameter holding the focused passage as an OSIS ID (`?ref=John.3.16`, `?ref=Isa.53`). */
const PASSAGE_PARAM = 'ref';
/** The minimum number of votes, when it isn't the default: a number, or `all` for no minimum. */
const VOTES_PARAM = 'votes';
/** Hidden genres, comma-separated, e.g. `hide=law,history`. */
const HIDE_PARAM = 'hide';

/** A page of the explorer: which view it shows, and where. */
export interface ViewRoute<Id extends string> {
  readonly id: Id;
  /** Path relative to the site's base: `''` for the home page, or e.g. `'threads/'`. */
  readonly path: string;
}

/** What the URL says: the active view, the focused passage and the link filter. */
export interface ExplorerLocation<Id extends string> {
  readonly view: Id;
  readonly passage: Passage | null;
  readonly filter: LinkFilter;
}

/** Unknown thresholds and genres fall back to the defaults. */
function parseFilter(params: URLSearchParams): LinkFilter {
  const votes = params.get(VOTES_PARAM);
  const minVotes = votes === 'all' ? -Infinity : Number(votes);
  const hidden = new Set((params.get(HIDE_PARAM) ?? '').split(','));
  return {
    minVotes:
      votes !== null && VOTE_THRESHOLDS.includes(minVotes)
        ? minVotes
        : DEFAULT_LINK_FILTER.minVotes,
    hiddenGenres: new Set(GENRES.filter(({ id }) => hidden.has(id)).map(({ id }) => id)),
  };
}

/** `threads`, `threads/` and `threads/index.html` all name the `threads/` page. */
function normalizePath(path: string): string {
  const withoutIndex = path.endsWith('index.html') ? path.slice(0, -'index.html'.length) : path;
  return withoutIndex === '' || withoutIndex.endsWith('/') ? withoutIndex : `${withoutIndex}/`;
}

/**
 * Reads the view, the passage and the filter from a URL. Unknown paths show the home view (the
 * first route), an unknown passage shows none, and unknown filter values keep the defaults.
 */
export function parseExplorerUrl<Id extends string>(
  url: URL,
  base: string,
  routes: readonly [ViewRoute<Id>, ...ViewRoute<Id>[]],
  versification: Versification,
): ExplorerLocation<Id> {
  const path = url.pathname.startsWith(base) ? normalizePath(url.pathname.slice(base.length)) : '';
  const route = routes.find((candidate) => candidate.path === path) ?? routes[0];
  const id = url.searchParams.get(PASSAGE_PARAM);
  return {
    view: route.id,
    passage: id === null ? null : (parsePassageOsisId(id, versification) ?? null),
    filter: parseFilter(url.searchParams),
  };
}

/**
 * The URL (path and query, without the origin) that shows a passage in a view with a filter.
 * Defaults are left out, so a plain link stays plain.
 */
export function explorerUrl(
  route: ViewRoute<string>,
  { passage, filter }: Pick<ExplorerLocation<string>, 'passage' | 'filter'>,
  base: string,
  versification: Versification,
): string {
  const params = new URLSearchParams();
  if (passage !== null) {
    params.set(PASSAGE_PARAM, toPassageOsisId(passage, versification));
  }
  if (filter.minVotes !== DEFAULT_LINK_FILTER.minVotes) {
    params.set(VOTES_PARAM, filter.minVotes === -Infinity ? 'all' : String(filter.minVotes));
  }
  if (filter.hiddenGenres.size > 0) {
    const hidden = GENRES.filter(({ id }) => filter.hiddenGenres.has(id)).map(({ id }) => id);
    params.set(HIDE_PARAM, hidden.join(','));
  }
  // Commas are fine in a query and far more readable than %2C.
  const query = params.toString().replaceAll('%2C', ',');
  return `${base}${route.path}${query === '' ? '' : `?${query}`}`;
}
