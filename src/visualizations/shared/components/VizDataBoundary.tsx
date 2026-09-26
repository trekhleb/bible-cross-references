import { Suspense, use, type ReactNode } from 'react';
import { ErrorBoundary } from '../../../shared/ui/ErrorBoundary.tsx';
import { RetryIcon } from '../../../shared/ui/icons.tsx';
import { vizDataLoader, type VizData } from '../viz-data.ts';
import styles from './controls.module.css';
import { LoadingArcs } from './LoadingArcs.tsx';

interface VizDataBoundaryProps {
  readonly children: (data: VizData) => ReactNode;
}

function Loaded({ children }: VizDataBoundaryProps) {
  return children(use(vizDataLoader.load()));
}

/** Loads the shared data with Suspense and shows a retryable error if it fails. */
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
              vizDataLoader.reset();
              reset();
            }}
          >
            <RetryIcon />
            Retry
          </button>
        </div>
      )}
    >
      <Suspense
        fallback={<LoadingArcs label="Loading 31,102 verses and 344,799 cross-references…" />}
      >
        <Loaded>{children}</Loaded>
      </Suspense>
    </ErrorBoundary>
  );
}
