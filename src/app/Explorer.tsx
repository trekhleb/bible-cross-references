import { t } from '../locales/ui.ts';
import { useEffect, useMemo, useOptimistic, useRef, useState, useTransition, use } from 'react';
import { formatPassage, type Passage } from '../core/bible/passage.ts';
import { ErrorBoundary } from '../shared/ui/ErrorBoundary.tsx';
import { getTranslationManifest } from '../translations/registry.ts';
import controls from '../visualizations/shared/components/controls.module.css';
import { DEFAULT_LINK_FILTER } from '../visualizations/shared/link-filter.ts';
import { Credits } from '../visualizations/shared/components/Credits.tsx';
import { TranslationMenu } from '../visualizations/shared/components/TranslationMenu.tsx';
import { VizPage } from '../visualizations/shared/components/VizPage.tsx';
import {
  resetTranslation,
  translationLoader,
  type VizCore,
  type VizData,
} from '../visualizations/shared/viz-data.ts';
import styles from './Explorer.module.css';
import { explorerUrl, plainTranslationFor } from './explorer-location.ts';
import { InAppLink } from './InAppLink.tsx';
import { useTranslationPreference } from './translation-choice.ts';
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
export function Explorer({ core }: { readonly core: VizCore }) {
  const { versification } = core;
  // The reader's own translation, from an earlier visit; the URL still wins over it.
  const [preferredTranslation, rememberTranslation] = useTranslationPreference();
  // The URL holds the view, the passage, the filter and the translation: one filter for every
  // view, so they agree on which links exist, and a shared link shows exactly what its author saw.
  const [location, navigate] = useExplorerLocation(VIEWS, versification, preferredTranslation);
  const { passage, filter } = location;
  // Suspends until the chosen text is here. Switching happens in a transition, so the previous
  // text stays on screen while the next one downloads instead of the page emptying.
  const translation = use(translationLoader(location.translation).load());
  const data = useMemo<VizData>(() => ({ ...core, translation }), [core, translation]);
  const [isSwitchingTranslation, switchTranslation] = useTransition();
  // Where the reader is by the time a text arrives, which is not where they were when they asked
  // for it: a download takes a second or two, and they can read on meanwhile.
  const locationRef = useRef(location);
  useEffect(() => {
    locationRef.current = location;
  }, [location]);
  // The last text asked for, so that a slow first choice cannot overrule a quick second one.
  const requestedTranslation = useRef(location.translation);
  const [translationError, setTranslationError] = useState<string | null>(null);
  // The picker shows the chosen translation the moment it is picked; the text on screen catches
  // up when its file arrives, which on a slow connection is a second or two later.
  const [chosenTranslation, chooseTranslation] = useOptimistic(location.translation);
  // Bumped by the home link: part of every view's key, so each one remounts from scratch.
  const [generation, setGeneration] = useState(0);
  // After the switch or the home link, keyboard focus follows into the newly shown view: this is
  // the element to focus there.
  const focusTarget = useRef<string | null>(null);
  const active = VIEWS.find((view) => view.id === location.view) ?? HOME;

  const title = [
    passage && formatPassage(passage, versification),
    active === HOME ? null : t(active.title),
    t(import.meta.env.SITE_NAME),
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

  const plainTranslation = plainTranslationFor(preferredTranslation);
  const hrefOf = (view: View, target: Passage | null) =>
    explorerUrl(
      view,
      { passage: target, filter, translation: location.translation },
      import.meta.env.BASE_URL,
      versification,
      plainTranslation,
    );

  // Beside the search box: what a reader is looking at, not how it is drawn, so it sits with the
  // passage rather than with the filters.
  const translationMenu = (
    <TranslationMenu
      current={getTranslationManifest(chosenTranslation)}
      pending={isSwitchingTranslation}
      error={translationError}
      onChange={(id) => {
        setTranslationError(null);
        requestedTranslation.current = id;
        switchTranslation(async () => {
          // The picker moves at once; the text takes a moment, and the previous one stays on
          // screen meanwhile. Fetching here rather than while rendering keeps a failed download
          // (offline, say) from replacing the page with an error: the reader keeps what they had.
          chooseTranslation(id);
          try {
            await translationLoader(id).load();
          } catch {
            resetTranslation(id);
            setTranslationError(
              t('{name} could not be loaded.', { name: getTranslationManifest(id).name }),
            );
            return;
          }
          if (requestedTranslation.current !== id) {
            return; // They have since asked for another one; that request owns the screen.
          }
          // Remembered only now: a text that never arrived must not greet them next time.
          rememberTranslation(id);
          // Like a filter change: Back returns to the previous passage, not the previous text.
          navigate({ ...locationRef.current, translation: id }, { replace: true });
        });
      }}
    />
  );

  const masthead = (
    <>
      <h1 className={styles.title}>
        <InAppLink
          href={hrefOf(HOME, null)}
          className={styles.home}
          onFollow={() => {
            focusTarget.current = 'h1 a';
            navigate({
              view: HOME.id,
              passage: null,
              filter: DEFAULT_LINK_FILTER,
              translation: location.translation,
            });
            setGeneration((value) => value + 1);
          }}
        >
          {t(import.meta.env.SITE_NAME)}
        </InAppLink>
      </h1>
      <ViewSwitch
        views={VIEWS}
        current={location.view}
        hrefOf={(view) => hrefOf(view, passage)}
        onOpen={(view) => {
          focusTarget.current = '[aria-current="page"]';
          navigate({ ...location, view: view.id, passage });
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
            <VizPage masthead={masthead} credits={<Credits translation={translation.manifest} />}>
              <p role="alert" className={styles.error}>
                {t('{view} could not start: {error}', {
                  view: t(view.title),
                  error: error.message,
                })}
              </p>
            </VizPage>
          )}
        >
          <view.Component
            data={data}
            active={isActive}
            passage={passage}
            onNavigate={(target) => {
              navigate({ ...location, view: view.id, passage: target });
            }}
            filter={filter}
            onFilterChange={(next) => {
              // A filter tweak replaces the history entry: Back returns to the previous passage.
              navigate({ ...location, filter: next }, { replace: true });
            }}
            masthead={masthead}
            translationMenu={translationMenu}
            shareUrl={(target) =>
              new URL(
                explorerUrl(
                  HOME,
                  {
                    passage: target,
                    filter: DEFAULT_LINK_FILTER,
                    translation: location.translation,
                  },
                  '',
                  versification,
                  // A quote carries the name of the text it is in, so its link always names it
                  // too: whoever opens it reads the words that were quoted, not their own
                  // translation of them.
                  null,
                ),
                data.translation.manifest.previewNotice
                  ? window.location.origin
                  : import.meta.env.SITE_URL,
              ).href
            }
            passageLinks={(target) =>
              VIEWS.filter((other) => other !== view).map((other) => (
                <InAppLink
                  key={other.id}
                  href={hrefOf(other, target)}
                  className={controls.button}
                  onFollow={() => {
                    navigate({ ...location, view: other.id, passage: target });
                  }}
                >
                  <other.icon />
                  {t(other.openLabel)}
                </InAppLink>
              ))
            }
          />
        </ErrorBoundary>
      </div>
    );
  });
}
