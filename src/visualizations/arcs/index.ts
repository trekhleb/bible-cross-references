import { lazy } from 'react';
import { ArcsIcon } from '../../shared/ui/icons.tsx';
import type { Visualization } from '../visualization.ts';

// The view's code, with Three.js, is a chunk of its own. Its download starts as soon as the app
// lists the views, in parallel with the data, while the page shows its loading screen.
const explorer = import('./ArcsExplorer.tsx');

export const arcs = {
  id: 'arcs',
  title: 'Arcs',
  shortTitle: 'Arcs',
  icon: ArcsIcon,
  openLabel: 'Show in Arcs',
  Component: lazy(async () => ({ default: (await explorer).ArcsExplorer })),
} as const satisfies Visualization;
