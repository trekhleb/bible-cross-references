import type { ReactNode } from 'react';
import { SiteFooter } from '../../../shared/ui/SiteFooter.tsx';
import { useBottomSheet } from '../use-bottom-sheet.ts';
import styles from './VizPage.module.css';

interface VizPageProps {
  /** The header's leading part, provided by the host app: the site's name and navigation. */
  readonly masthead?: ReactNode;
  /** Search box, filters and visualization-specific controls. */
  readonly controls?: ReactNode;
  /** The details panel: a side column on wide screens, a bottom sheet on phones; omit or pass
   * `null` / `false` for none. */
  readonly panel?: ReactNode;
  /** Closes the panel; on phones, pulling its sheet down from the collapsed height calls it. */
  readonly onPanelClose?: () => void;
  /** Data attribution and inspiration, shown in the footer. */
  readonly credits: ReactNode;
  /** The visualization itself. */
  readonly children: ReactNode;
}

/** The shared frame of every visualization page. */
export function VizPage({
  masthead,
  controls,
  panel,
  onPanelClose,
  credits,
  children,
}: VizPageProps) {
  const hasPanel = panel !== undefined && panel !== null && panel !== false;
  const { expanded, setExpanded, containerRef, sheetRef, spaceRef, scrimRef } = useBottomSheet(
    hasPanel,
    onPanelClose,
  );
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.masthead}>{masthead}</div>
        <div className={styles.controls}>{controls}</div>
      </header>
      <div
        ref={containerRef}
        className={styles.body}
        data-sheet={hasPanel ? (expanded ? 'expanded' : 'collapsed') : undefined}
      >
        <main className={styles.stage}>{children}</main>
        {hasPanel && (
          <>
            {/* Phones: the collapsed sheet's room, so the visualization lays out above it. */}
            <div ref={spaceRef} className={styles.sheetSpace} aria-hidden="true" />
            <div
              ref={scrimRef}
              className={styles.sheetScrim}
              aria-hidden="true"
              onClick={() => {
                setExpanded(false);
              }}
            />
            <aside ref={sheetRef} className={styles.panel} aria-label="Details">
              <button
                type="button"
                className={styles.sheetHandle}
                aria-label={expanded ? 'Collapse details' : 'Expand details'}
                aria-expanded={expanded}
                onClick={() => {
                  setExpanded(!expanded);
                }}
              />
              {panel}
            </aside>
          </>
        )}
      </div>
      <SiteFooter className={styles.footer}>{credits}</SiteFooter>
    </div>
  );
}
