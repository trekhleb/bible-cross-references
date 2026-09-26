import { useRef, useState, type ReactNode } from 'react';
import { SiteFooter } from '../../../shared/ui/SiteFooter.tsx';
import styles from './VizPage.module.css';

interface VizPageProps {
  /** The header's leading part, provided by the host app: the site's name and navigation. */
  readonly masthead?: ReactNode;
  /** Search box, filters and visualization-specific controls. */
  readonly controls?: ReactNode;
  /** The details panel: a side column on wide screens, a bottom sheet on phones; omit or pass
   * `null` / `false` for none. */
  readonly panel?: ReactNode;
  /** Data attribution and inspiration, shown in the footer. */
  readonly credits: ReactNode;
  /** The visualization itself. */
  readonly children: ReactNode;
}

/** Vertical drag on the sheet handle beyond which it counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD_PX = 24;

/** The shared frame of every visualization page. */
export function VizPage({ masthead, controls, panel, credits, children }: VizPageProps) {
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const swipeStart = useRef<number | null>(null);
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.masthead}>{masthead}</div>
        <div className={styles.controls}>{controls}</div>
      </header>
      <div className={styles.body}>
        <main className={styles.stage}>{children}</main>
        {panel !== undefined && panel !== null && panel !== false && (
          <aside className={styles.panel} data-expanded={sheetExpanded} aria-label="Details">
            <button
              type="button"
              className={styles.sheetHandle}
              aria-label={sheetExpanded ? 'Collapse details' : 'Expand details'}
              aria-expanded={sheetExpanded}
              onPointerDown={(event) => {
                swipeStart.current = event.clientY;
              }}
              onPointerUp={(event) => {
                const start = swipeStart.current;
                swipeStart.current = null;
                const distance = start === null ? 0 : event.clientY - start;
                if (Math.abs(distance) < SWIPE_THRESHOLD_PX) {
                  setSheetExpanded((expanded) => !expanded); // A tap toggles.
                } else {
                  setSheetExpanded(distance < 0); // Swipe up expands, swipe down collapses.
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSheetExpanded((expanded) => !expanded);
                }
              }}
            />
            {panel}
          </aside>
        )}
      </div>
      <SiteFooter className={styles.footer}>{credits}</SiteFooter>
    </div>
  );
}
