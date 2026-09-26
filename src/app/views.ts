import { arcs } from '../visualizations/arcs/index.ts';
import { threads } from '../visualizations/threads/index.ts';

/**
 * The explorer's visualizations, in the order of its switch, each with its page path relative to
 * the site's base. The first one is the home page. Every other path has its own HTML entry (e.g.
 * `threads/index.html`), so links straight into it work on a static host such as GitHub Pages.
 */
export const VIEWS = [
  { ...arcs, path: '' },
  { ...threads, path: 'threads/' },
] as const;

export type View = (typeof VIEWS)[number];
export type ViewId = View['id'];
