import controls from '../visualizations/shared/components/controls.module.css';
import { InAppLink } from './InAppLink.tsx';
import type { View, ViewId } from './views.ts';

interface ViewSwitchProps {
  readonly views: readonly View[];
  readonly current: ViewId;
  /** The URL of a view, keeping the focused passage. */
  readonly hrefOf: (view: View) => string;
  readonly onOpen: (view: View) => void;
}

/** The header's switch between the visualizations: links that keep the focused passage. */
export function ViewSwitch({ views, current, hrefOf, onOpen }: ViewSwitchProps) {
  return (
    <nav aria-label="Visualizations" className={controls.segmented}>
      {views.map((view) => (
        <InAppLink
          key={view.id}
          href={hrefOf(view)}
          className={controls.button}
          // The full title names the link even where only the short one is visible.
          aria-label={view.title}
          aria-current={view.id === current ? 'page' : undefined}
          onFollow={() => {
            onOpen(view);
          }}
        >
          <view.icon />
          <span className={controls.longLabel}>{view.title}</span>
          <span className={controls.shortLabel}>{view.shortTitle}</span>
        </InAppLink>
      ))}
    </nav>
  );
}
