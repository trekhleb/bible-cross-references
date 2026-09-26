import type { ReactNode } from 'react';
import { formatInteger, formatShare } from '../../../shared/lib/format.ts';
import type { LinkSummary } from '../link-summary.ts';
import styles from './LinkStats.module.css';

interface LinkStatsProps {
  readonly summary: LinkSummary;
  /**
   * How to interact, shown under the numbers: with a mouse (on wide screens), or on a touch
   * screen (phones included, since touch gestures are harder to guess).
   */
  readonly hint?: { readonly pointer: ReactNode; readonly touch: ReactNode };
}

/** A quiet corner summary of what is on screen; context, not the main event. */
export function LinkStats({ summary, hint }: LinkStatsProps) {
  const { verseCount, shownLinks, totalLinks, connectedVerses, crossTestamentLinks } = summary;
  return (
    <div className={styles.stats} aria-label="Summary">
      <span>
        <strong>{formatInteger(verseCount)}</strong> verses ·{' '}
        <strong>{formatInteger(shownLinks)}</strong>
        {shownLinks < totalLinks && ` of ${formatInteger(totalLinks)}`} links shown
      </span>
      <span className={styles.secondary}>
        <strong>{formatShare(connectedVerses, verseCount)}</strong> of verses connected ·{' '}
        <strong>{formatInteger(crossTestamentLinks)}</strong> links between the testaments
      </span>
      {hint !== undefined && (
        <>
          <span className={`${styles.hint} ${styles.pointerHint}`}>{hint.pointer}</span>
          <span className={`${styles.hint} ${styles.touchHint}`}>{hint.touch}</span>
        </>
      )}
    </div>
  );
}
