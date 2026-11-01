import { t, uiLanguage } from '../../locales/ui.ts';
import { Suspense, use, useEffect } from 'react';
import { CROSS_REFERENCE_SOURCE_MANIFESTS } from '../../cross-references/registry.ts';
import { ErrorBoundary } from '../../shared/ui/ErrorBoundary.tsx';
import { RetryIcon } from '../../shared/ui/icons.tsx';
import { SiteFooter } from '../../shared/ui/SiteFooter.tsx';
import { crossReferencesSectionId, DebugDashboard, SECTION_IDS } from './DebugDashboard.tsx';
import { debugDataLoader } from './debug-data.ts';
import styles from './DebugPage.module.css';

const NAVIGATION: readonly { readonly id: string; readonly label: string }[] = [
  { id: SECTION_IDS.datasets, label: t('Datasets') },
  { id: SECTION_IDS.translation, label: t('Translation') },
  ...CROSS_REFERENCE_SOURCE_MANIFESTS.map((manifest) => ({
    id: crossReferencesSectionId(manifest.id),
    label: t('Cross-references'),
  })),
  { id: SECTION_IDS.inspector, label: t('Verse inspector') },
  { id: SECTION_IDS.search, label: t('Text search') },
];

function LoadedDashboard() {
  return <DebugDashboard data={use(debugDataLoader.load())} />;
}

function LoadError({ error, onRetry }: { readonly error: Error; readonly onRetry: () => void }) {
  return (
    <div role="alert" className={styles.loadError}>
      <h2>{t('Could not load the datasets')}</h2>
      <p>{error.message}</p>
      <button type="button" className={styles.button} onClick={onRetry}>
        <RetryIcon />
        {t('Retry')}
      </button>
    </div>
  );
}

/** Internal page for inspecting the datasets the app is built on. */
export function DebugPage() {
  useEffect(() => {
    document.documentElement.lang = uiLanguage();
  }, []);
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>{t('Internal · for development')}</p>
        <h1 className={styles.title}>
          <a className={styles.home} href={import.meta.env.BASE_URL}>
            {import.meta.env.SITE_NAME}
          </a>{' '}
          {t('· Data debug')}
        </h1>
        <nav aria-label={t('Sections')}>
          <ul className={styles.navigation}>
            {NAVIGATION.map(({ id, label }) => (
              <li key={id}>
                <a href={`#${id}`}>{label}</a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className={styles.main}>
        <ErrorBoundary
          fallback={(error, reset) => (
            <LoadError
              error={error}
              onRetry={() => {
                debugDataLoader.reset();
                reset();
              }}
            />
          )}
        >
          <Suspense fallback={<p className={styles.muted}>{t('Loading datasets…')}</p>}>
            <LoadedDashboard />
          </Suspense>
        </ErrorBoundary>
      </main>
      <SiteFooter className={styles.footer} />
    </div>
  );
}
