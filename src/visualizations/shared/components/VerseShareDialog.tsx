import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocalization } from '../../../i18n/use-locale.tsx';
import {
  CloseIcon,
  CopiedIcon,
  CopyIcon,
  CopyLinkIcon,
  InstallIcon,
  ShareVerseIcon,
} from '../../../shared/ui/icons.tsx';
import { canCopy, copyQuote } from '../passage-quote.ts';
import type { VerseCardInput } from '../verse-card.ts';
import { renderVerseCard } from '../verse-card-image.ts';
import type { VerseShareRequest } from '../verse-share.ts';
import styles from './VerseShareDialog.module.css';

/**
 * How the dialog opens, set by the one that is mounted. Both views stay mounted at once, so the
 * dialog lives outside them — the same arrangement as the install guide, and for the same
 * reason: one dialog, whichever view the reader is in.
 */
let show: ((request: VerseShareRequest) => void) | null = null;

/** Opens the share dialog on a verse. Does nothing if no dialog is mounted. */
export function openVerseShare(request: VerseShareRequest): void {
  show?.(request);
}

/**
 * What names the dialog to a screen reader: the reference, which is the whole of what it is
 * about. Fixed rather than from `useId`, because only ever one of these is mounted — the same
 * arrangement, and the same reasoning, as the install guide's own title.
 */
const TITLE_ID = 'verse-share-title';

/** How long a button says it copied. */
const COPIED_FEEDBACK_MS = 1600;

type Drawing =
  | { readonly state: 'drawing' }
  | { readonly state: 'ready'; readonly blob: Blob; readonly src: string }
  | { readonly state: 'failed' };

/**
 * A button's label that says something else for a moment, without the button changing size: both
 * wordings are laid out in one place and only one is seen (see `.steadyLabel`). The other is
 * hidden from assistive technology too, so the button's name is only ever the one on show.
 */
function SteadyLabel({
  label,
  momentary,
  showMomentary,
}: {
  readonly label: string;
  readonly momentary: string;
  readonly showMomentary: boolean;
}) {
  return (
    <span className={styles.steadyLabel}>
      <span className={showMomentary ? styles.unseen : undefined} aria-hidden={showMomentary}>
        {label}
      </span>
      <span className={showMomentary ? undefined : styles.unseen} aria-hidden={!showMomentary}>
        {momentary}
      </span>
    </span>
  );
}

/**
 * A verse as a picture, with the ways of sending it.
 *
 * The card is drawn when the dialog opens rather than when Share is pressed: `navigator.share`
 * has to be called inside the gesture that asked for it, and a canvas awaited in between spends
 * the user activation, after which Safari refuses the share with no way to tell why.
 */
export function VerseShareDialog({
  renderCard = renderVerseCard,
}: {
  /** Injected by the tests, which have no canvas to draw on. */
  readonly renderCard?: (input: VerseCardInput) => Promise<Blob>;
} = {}) {
  const { t } = useLocalization();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [request, setRequest] = useState<VerseShareRequest | null>(null);
  const [drawing, setDrawing] = useState<Drawing>({ state: 'drawing' });
  const [copied, setCopied] = useState<'text' | 'link' | null>(null);
  /** The platform took the gesture and refused the picture; offering it again would not help. */
  const [shareRefused, setShareRefused] = useState(false);

  useEffect(() => {
    show = (next) => {
      setRequest(next);
      setCopied(null);
      setShareRefused(false);
      setDrawing({ state: 'drawing' });
    };
    return () => {
      show = null;
    };
  }, []);

  /**
   * Shown only once the sheet is in the DOM.
   *
   * `showModal()` moves focus, and it moves it to the dialog element itself when the dialog has
   * no focusable child — which is what happened when this was called in the same breath as the
   * state change that fills it. The reference was not there to be announced either, because
   * `aria-labelledby` pointed at a heading React had not rendered yet. A layout effect runs
   * after the render and before the paint, so the first thing anyone sees or hears is the
   * finished sheet.
   */
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (request && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [request]);

  // One object URL at a time, released when the card is replaced or the dialog closes: a card is
  // a megabyte of bitmap, and a reader who shares ten verses should not be holding ten of them.
  useEffect(() => {
    if (!request) {
      return undefined;
    }
    let url: string | null = null;
    let current = true;
    renderCard(request).then(
      (blob) => {
        if (!current) {
          return;
        }
        url = URL.createObjectURL(blob);
        setDrawing({ state: 'ready', blob, src: url });
      },
      () => {
        if (current) {
          setDrawing({ state: 'failed' });
        }
      },
    );
    return () => {
      current = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [request, renderCard]);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setCopied(null);
    }, COPIED_FEEDBACK_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [copied]);

  const close = useCallback(() => {
    dialogRef.current?.close();
    setRequest(null);
  }, []);

  if (!request) {
    return (
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={TITLE_ID}
        onClose={close}
      />
    );
  }

  const file =
    drawing.state === 'ready'
      ? new File([drawing.blob], `${request.reference.replace(/[^\p{L}\p{N}]+/gu, '-')}.png`, {
          type: 'image/png',
        })
      : null;
  // Only where the browser will actually take a picture: desktop Safari and Firefox offer
  // `share` but refuse files, and a Share button that silently does nothing is worse than none.
  // `canShare` is typed as always present and is not, so it is asked for rather than called.
  const canSendFile =
    !shareRefused &&
    file !== null &&
    'canShare' in navigator &&
    navigator.canShare({ files: [file] });
  const copyable = canCopy();

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby={TITLE_ID}
      // Tapping outside closes it, as the install guide does and as every sheet on a phone does.
      // Measured against the card's own edges, because a click on the dialog's scrollbar has the
      // dialog as its target too and is not a tap outside.
      onClick={(event) => {
        const dialog = dialogRef.current;
        if (!dialog || event.target !== dialog || event.detail > 1) {
          return;
        }
        const { top, right, bottom, left } = dialog.getBoundingClientRect();
        if (
          event.clientX < left ||
          event.clientX > right ||
          event.clientY < top ||
          event.clientY > bottom
        ) {
          dialog.close();
        }
      }}
      onClose={close}
    >
      <div className={styles.sheet}>
        <header className={styles.header}>
          <h2 id={TITLE_ID} className={styles.title}>
            {request.reference}
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label={t('panel.close')}
            onClick={close}
          >
            <CloseIcon />
          </button>
        </header>

        <div className={styles.preview}>
          {drawing.state === 'ready' ? (
            <img
              className={styles.card}
              src={drawing.src}
              alt={t('share.preview')(request.reference)}
            />
          ) : (
            <p className={styles.placeholder}>
              {drawing.state === 'failed' ? t('share.failed') : t('share.preparing')}
            </p>
          )}
        </div>

        {/* Two pairs: the picture first (Share, Save image), then what can be pasted (Copy text,
            Copy link). A pair can be missing a member, or be absent altogether: there is no
            picture until it is drawn, no Share where the browser refuses files, and no copying
            without a clipboard. */}
        {(drawing.state === 'ready' || copyable) && (
          <div className={styles.actions}>
            {drawing.state === 'ready' && (
              <div className={styles.pair}>
                {canSendFile && (
                  <button
                    type="button"
                    className={`${styles.action} ${styles.primary}`}
                    onClick={() => {
                      void navigator
                        .share({ files: [file], text: request.quote.text, url: request.url })
                        .catch((error: unknown) => {
                          // Dismissing the system sheet is an answer, not a fault, and the only
                          // one that should leave the card exactly as it was. Anything else
                          // means this browser will not take the picture, so the button goes
                          // and the reader is left with the ways of keeping it that do work.
                          const name = error instanceof Error ? error.name : '';
                          if (name !== 'AbortError') {
                            setShareRefused(true);
                          }
                        });
                    }}
                  >
                    <ShareVerseIcon />
                    {t('share.send')}
                  </button>
                )}
                <a className={styles.action} href={drawing.src} download={file?.name}>
                  <InstallIcon />
                  {t('share.save')}
                </a>
              </div>
            )}
            {copyable && (
              <div className={styles.pair}>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    void copyQuote(request.quote).then(
                      () => {
                        setCopied('text');
                      },
                      () => undefined,
                    );
                  }}
                >
                  {copied === 'text' ? <CopiedIcon /> : <CopyIcon />}
                  <SteadyLabel
                    label={t('share.copyText')}
                    momentary={t('share.copied')}
                    showMomentary={copied === 'text'}
                  />
                </button>
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    void navigator.clipboard.writeText(request.url).then(
                      () => {
                        setCopied('link');
                      },
                      () => undefined,
                    );
                  }}
                >
                  {copied === 'link' ? <CopiedIcon /> : <CopyLinkIcon />}
                  <SteadyLabel
                    label={t('share.copyLink')}
                    momentary={t('share.copied')}
                    showMomentary={copied === 'link'}
                  />
                </button>
              </div>
            )}
          </div>
        )}

        <span className={styles.visuallyHidden} role="status">
          {copied === null ? '' : t('share.copied')}
        </span>
      </div>
    </dialog>
  );
}
