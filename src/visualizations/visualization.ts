import type { JSXElementConstructor, ReactNode } from 'react';
import type { Passage } from '../core/bible/passage.ts';
import type { IconComponent } from '../shared/ui/icons.tsx';
import type { LinkFilter } from './shared/link-filter.ts';
import type { VizData } from './shared/viz-data.ts';

/**
 * What the host app gives a visualization. The host owns the URL, where it keeps the focused
 * passage and the active visualization, so every visualization shares the same passage.
 */
export interface VisualizationProps {
  readonly data: VizData;
  /** The focused passage, or `null` for none. */
  readonly passage: Passage | null;
  /** Focuses another passage (or none); the host records it in the URL and the history. */
  readonly onNavigate: (passage: Passage | null) => void;
  /** Which links to show. One filter for every visualization, so they agree on the links. */
  readonly filter: LinkFilter;
  readonly onFilterChange: (filter: LinkFilter) => void;
  /**
   * Whether the visualization is on screen. The host keeps every visualization mounted, so a
   * hidden one should stop drawing (and start its intro once shown).
   */
  readonly active: boolean;
  /** The header's leading part from the host: the site's name (a link home) and the switch
   * between visualizations. */
  readonly masthead: ReactNode;
  /** Links that open a passage in the other visualizations, for the details panel. */
  readonly passageLinks: (passage: Passage) => ReactNode;
  /** A passage's address on the published site, for links meant for others (copied quotes). */
  readonly shareUrl: (passage: Passage) => string;
}

/**
 * A visualization of the explorer. Each folder under `src/visualizations/` exports one from its
 * `index.ts`, and the app lists them in `src/app/views.ts`. Visualizations never import each other;
 * the host connects them.
 */
export interface Visualization {
  readonly id: string;
  readonly title: string;
  /** Shown instead of the title on phones. */
  readonly shortTitle: string;
  readonly icon: IconComponent;
  /** Invites a reader into this visualization from another one, e.g. "Read in context". */
  readonly openLabel: string;
  /** Usually lazy, so each visualization's code (e.g. Three.js) is a chunk of its own. */
  readonly Component: JSXElementConstructor<VisualizationProps>;
}
