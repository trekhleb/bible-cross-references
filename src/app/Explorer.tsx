import { useEffect, useRef, useState } from 'react';
import { formatPassage, type Passage } from '../core/bible/passage.ts';
import { ErrorBoundary } from '../shared/ui/ErrorBoundary.tsx';
import controls from '../visualizations/shared/components/controls.module.css';
import { DEFAULT_LINK_FILTER } from '../visualizations/shared/link-filter.ts';
import { Credits } from '../visualizations/shared/components/Credits.tsx';
import { VizPage } from '../visualizations/shared/components/VizPage.tsx';
import type { VizData } from '../visualizations/shared/viz-data.ts';
import styles from './Explorer.module.css';
import { explorerUrl } from './explorer-location.ts';
import { InAppLink } from './InAppLink.tsx';
import { useExplorerLocation } from './use-explorer-location.ts';
import { ViewSwitch } from './ViewSwitch.tsx';
import { VIEWS, type View } from './views.ts';

const [HOME] = VIEWS;

/**
 * The app: every visualization over one shared passage, with a switch between them.
 *
 * All of them stay mounted and only the active one is shown, so switching is instant and each
 * keeps its own state (the arcs' zoom, the reading position, the filters). The site's name links
 * home and starts over: it remounts every view in its default state.
 */
export function Explorer({ data }: { readonly data: VizData }) {
  const { versification } = data;
  // The URL holds the view, the passage and the filter: one filter for every view, so they agree
  // on which links exist, and a shared link shows exactly what its author saw.
  const [location, navigate] = useExplorerLocation(VIEWS, versification);
  const { passage, filter } = location;
  // Bumped by the home link: part of every view's key, so each one remounts from scratch.
  const [generation, setGeneration] = useState(0);
  // After the switch or the home link, keyboard focus follows into the newly shown view: this is
  // the element to focus there.
  const focusTarget = useRef<string | null>(null);
  const active = VIEWS.find((view) => view.id === location.view) ?? HOME;

  const title = [
    passage && formatPassage(passage, versification),
    active === HOME ? null : active.title,
    import.meta.env.SITE_NAME,
  ]
    .filter((part) => part !== null)
    .join(' · ');
  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    const selector = focusTarget.current;
    if (selector !== null) {
      focusTarget.current = null;
      document.querySelector<HTMLElement>(`[data-view="${location.view}"] ${selector}`)?.focus();
    }
  }, [location.view, generation]);

  const hrefOf = (view: View, target: Passage | null) =>
    explorerUrl(view, { passage: target, filter }, import.meta.env.BASE_URL, versification);

  const masthead = (
    <>
      <h1 className={styles.title}>
        <InAppLink
          href={hrefOf(HOME, null)}
          className={styles.home}
          onFollow={() => {
            focusTarget.current = 'h1 a';
            navigate({ view: HOME.id, passage: null, filter: DEFAULT_LINK_FILTER });
            setGeneration((value) => value + 1);
          }}
        >
          {import.meta.env.SITE_NAME}
        </InAppLink>
      </h1>
      <ViewSwitch
        views={VIEWS}
        current={location.view}
        hrefOf={(view) => hrefOf(view, passage)}
        onOpen={(view) => {
          focusTarget.current = '[aria-current="page"]';
          navigate({ view: view.id, passage, filter });
        }}
      />
    </>
  );

  return VIEWS.map((view) => {
    const isActive = view === active;
    return (
      <div
        key={`${view.id}:${String(generation)}`}
        className={styles.view}
        data-view={view.id}
        data-active={isActive}
        inert={!isActive}
      >
        {/* One view failing (e.g. without WebGL) keeps the page frame, so the other stays one
            switch away. */}
        <ErrorBoundary
          fallback={(error) => (
            <VizPage masthead={masthead} credits={<Credits />}>
              <p role="alert" className={styles.error}>
                {view.title} could not start: {error.message}
              </p>
            </VizPage>
          )}
        >
          <view.Component
            data={data}
            active={isActive}
            passage={passage}
            onNavigate={(target) => {
              navigate({ view: view.id, passage: target, filter });
            }}
            filter={filter}
            onFilterChange={(next) => {
              // A filter tweak replaces the history entry: Back returns to the previous passage.
              navigate({ ...location, filter: next }, { replace: true });
            }}
            masthead={masthead}
            shareUrl={(target) =>
              new URL(
                explorerUrl(
                  HOME,
                  { passage: target, filter: DEFAULT_LINK_FILTER },
                  '',
                  versification,
                ),
                import.meta.env.SITE_URL,
              ).href
            }
            passageLinks={(target) =>
              VIEWS.filter((other) => other !== view).map((other) => (
                <InAppLink
                  key={other.id}
                  href={hrefOf(other, target)}
                  className={controls.button}
                  onFollow={() => {
                    navigate({ view: other.id, passage: target, filter });
                  }}
                >
                  <other.icon />
                  {other.openLabel}
                </InAppLink>
              ))
            }
          />
        </ErrorBoundary>
      </div>
    );
  });
}
