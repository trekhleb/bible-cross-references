import { t } from '../../../locales/ui.ts';
import { Suspense, use, type ReactNode } from 'react';
import { ErrorBoundary } from '../../../shared/ui/ErrorBoundary.tsx';
import { RetryIcon } from '../../../shared/ui/icons.tsx';
import { resetTranslations, vizCoreLoader, type VizCore } from '../viz-data.ts';
import styles from './controls.module.css';
import { LoadingArcs } from './LoadingArcs.tsx';

interface VizDataBoundaryProps {
  readonly children: (core: VizCore) => ReactNode;
}

function Loaded({ children }: VizDataBoundaryProps) {
  return children(use(vizCoreLoader.load()));
}

/**
 * Loads the shared data with Suspense and shows a retryable error if it fails. The text of a
 * translation loads inside (see `Explorer`), and a failure there lands in this boundary too, so
 * retrying forgets both.
 */
export function VizDataBoundary({ children }: VizDataBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div role="alert" style={{ padding: 'var(--space-6)' }}>
          <p>{error.message}</p>
          <button
            type="button"
            className={styles.button}
            onClick={() => {
              vizCoreLoader.reset();
              resetTranslations();
              reset();
            }}
          >
            <RetryIcon />
            {t('Retry')}
          </button>
        </div>
      )}
    >
      <Suspense
        fallback={<LoadingArcs label={t('Loading 31,102 verses and 344,799 cross-references…')} />}
      >
        <Loaded>{children}</Loaded>
      </Suspense>
    </ErrorBoundary>
  );
}
