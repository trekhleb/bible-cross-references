import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { verseIndex } from '../../../test-utils/fixtures.ts';
import { createVizData } from '../../../test-utils/viz-data.ts';
import { localizationFor } from '../../../i18n/use-locale.tsx';
import { DEFAULT_LINK_FILTER } from '../link-filter.ts';
import { buildVerseShareRequest } from '../verse-share.ts';
import { openVerseShare, VerseShareDialog } from './VerseShareDialog.tsx';

const JOHN_3_16 = verseIndex('John', 3, 16);
const ROM_5_8 = verseIndex('Rom', 5, 8);

const DATA = createVizData(
  [{ from: JOHN_3_16, to: ROM_5_8, toEnd: ROM_5_8, votes: 50 }],
  new Map([[JOHN_3_16, 'For God so loved the world…']]),
);

const URL_OF_VERSE = 'https://trekhleb.dev/bible-cross-references/?ref=John.3.16';

function aRequest() {
  return buildVerseShareRequest({
    data: DATA,
    filter: DEFAULT_LINK_FILTER,
    verse: JOHN_3_16,
    url: URL_OF_VERSE,
    localization: localizationFor('en'),
  });
}

let writeText: Mock<(text: string) => Promise<void>>;
let revoked: string[];

beforeEach(() => {
  writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
  Object.defineProperty(navigator, 'clipboard', {
    value: { write: vi.fn(() => Promise.resolve()), writeText },
    configurable: true,
    writable: true,
  });
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
  vi.stubGlobal('ClipboardItem', undefined);
  revoked = [];
  // happy-dom has no object URLs; the dialog's only use of them is as an <img> source.
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: vi.fn(() => 'blob:card'),
    revokeObjectURL: vi.fn((url: string) => revoked.push(url)),
  });
});

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard');
  Reflect.deleteProperty(navigator, 'canShare');
  Reflect.deleteProperty(navigator, 'share');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Mounts the dialog with a card that is drawn instantly, or refuses to be. */
function mountDialog({ fails = false } = {}) {
  const renderCard = vi.fn(() =>
    fails
      ? Promise.reject(new Error('no canvas'))
      : Promise.resolve(new Blob(['png'], { type: 'image/png' })),
  );
  render(<VerseShareDialog renderCard={renderCard} />);
  return renderCard;
}

async function open() {
  const request = aRequest();
  await act(async () => {
    openVerseShare(request);
    await Promise.resolve();
  });
  return request;
}

describe('the verse share dialog', () => {
  it('does nothing when nothing is mounted to open', () => {
    expect(() => {
      openVerseShare(aRequest());
    }).not.toThrow();
  });

  it('opens on a verse and names it', async () => {
    mountDialog();
    await open();
    expect(screen.getByRole('heading', { name: 'John 3:16' })).toBeTruthy();
  });

  /** A modal with no accessible name is announced as "dialog" and nothing else. */
  it('tells a screen reader which verse it is about', async () => {
    mountDialog();
    await open();
    const dialog = document.querySelector('dialog');
    const titled = document.getElementById(dialog?.getAttribute('aria-labelledby') ?? '');
    expect(titled?.textContent).toBe('John 3:16');
  });

  it('shows the card once it is drawn, as the picture that will be sent', async () => {
    mountDialog();
    await open();
    const card = await screen.findByRole('img', { name: /John 3:16/ });
    expect(card.getAttribute('src')).toBe('blob:card');
  });

  it('says so, and offers nothing it cannot deliver, when the card cannot be drawn', async () => {
    mountDialog({ fails: true });
    await open();
    await waitFor(() => {
      expect(screen.getByText('The card could not be drawn.')).toBeTruthy();
    });
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('link', { name: /Save image/ })).toBeNull();
  });

  it('copies the verse itself, with its reference and a link', async () => {
    mountDialog();
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Copy text' }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled();
    });
    const [written] = writeText.mock.calls[0] ?? [];
    expect(written).toContain('For God so loved the world…');
    expect(written).toContain('John 3:16 (BSB)');
    expect(written).toContain(URL_OF_VERSE);
  });

  it('says it copied, and then stops saying so', async () => {
    mountDialog();
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Copy text' }));
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeTruthy();
    await waitFor(
      () => {
        expect(screen.getByRole('button', { name: 'Copy text' })).toBeTruthy();
      },
      { timeout: 4000 },
    );
  });

  /**
   * "Copied" takes the label's place without the button changing size: both wordings stay in it,
   * and only the one on show gives the button its name.
   */
  it('keeps the button the same size while it says it copied', async () => {
    mountDialog();
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    const button = await screen.findByRole('button', { name: 'Copied' });
    expect(button.textContent).toContain('Copy link');
    expect(button.textContent).toContain('Copied');
    expect(screen.getByRole('button', { name: 'Copy text' })).toBeTruthy();
  });

  it('copies the address on its own, for somebody who wants the link and not the words', async () => {
    mountDialog();
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(URL_OF_VERSE);
    });
  });

  it('offers no clipboard buttons on a page that has no clipboard', async () => {
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });
    mountDialog();
    await open();
    expect(screen.queryByRole('button', { name: 'Copy text' })).toBeNull();
  });

  /**
   * The system sheet is the whole point on a phone, and the reason the card is drawn when the
   * dialog opens rather than when this is pressed: `share` has to be called inside the gesture.
   */
  it('hands the picture to the system where the browser will take one', async () => {
    const share = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    mountDialog();
    await open();
    await userEvent.click(await screen.findByRole('button', { name: 'Share' }));
    await waitFor(() => {
      expect(share).toHaveBeenCalled();
    });
    const [sent] = share.mock.calls[0] as unknown as [{ files: File[]; url: string }];
    expect(sent.files[0]?.type).toBe('image/png');
    expect(sent.url).toBe(URL_OF_VERSE);
  });

  it('keeps quiet when the reader dismisses the system sheet', async () => {
    const share = vi.fn(() => Promise.reject(new Error('AbortError')));
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    mountDialog();
    await open();
    await userEvent.click(await screen.findByRole('button', { name: 'Share' }));
    await waitFor(() => {
      expect(share).toHaveBeenCalled();
    });
    expect(screen.getByRole('heading', { name: 'John 3:16' })).toBeTruthy();
  });

  it('does not offer to share where the browser would refuse the picture', async () => {
    Object.defineProperty(navigator, 'canShare', { value: () => false, configurable: true });
    Object.defineProperty(navigator, 'share', { value: vi.fn(), configurable: true });
    mountDialog();
    await open();
    await screen.findByRole('img', { name: /John 3:16/ });
    expect(screen.queryByRole('button', { name: 'Share' })).toBeNull();
  });

  it('offers the card as a file to save', async () => {
    mountDialog();
    await open();
    const save = await screen.findByRole('link', { name: /Save image/ });
    expect(save.getAttribute('download')).toBe('John-3-16.png');
  });

  it('pairs the actions: the picture first, then what can be pasted', async () => {
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: vi.fn(), configurable: true });
    mountDialog();
    await open();
    const share = await screen.findByRole('button', { name: 'Share' });
    const save = screen.getByRole('link', { name: /Save image/ });
    const copyText = screen.getByRole('button', { name: 'Copy text' });
    const copyLink = screen.getByRole('button', { name: 'Copy link' });
    expect(save.parentElement).toBe(share.parentElement);
    expect(copyLink.parentElement).toBe(copyText.parentElement);
    expect(share.parentElement?.nextElementSibling).toBe(copyText.parentElement);
  });

  /**
   * Each pair is a row of its own, so a browser that will not share the picture leaves Save
   * image alone on its row, rather than pulling Copy text up beside it and splitting the two
   * ways of copying across rows.
   */
  it('keeps the two ways of copying together where the picture cannot be shared', async () => {
    mountDialog();
    await open();
    const save = await screen.findByRole('link', { name: /Save image/ });
    const copyText = screen.getByRole('button', { name: 'Copy text' });
    expect(save.parentElement?.children).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Copy link' }).parentElement).toBe(
      copyText.parentElement,
    );
  });

  /** Two buttons that look alike side by side read as one action offered twice. */
  it('marks copying the words and copying the link with different icons', async () => {
    mountDialog();
    await open();
    const glyph = (name: string) =>
      screen.getByRole('button', { name }).querySelector('svg')?.innerHTML ?? '';
    expect(glyph('Copy text')).not.toBe('');
    expect(glyph('Copy link')).not.toBe(glyph('Copy text'));
  });

  /**
   * `showModal()` moves focus, and it moves it to the dialog itself when the dialog is empty.
   * Opening before React has rendered the sheet put focus nowhere useful and pointed
   * `aria-labelledby` at a heading that did not exist yet.
   */
  it('is filled before it is shown, so focus has somewhere to land', async () => {
    let childrenWhenShown = -1;
    const showModal = vi
      .spyOn(HTMLDialogElement.prototype, 'showModal')
      .mockImplementation(function (this: HTMLDialogElement) {
        childrenWhenShown = this.children.length;
        this.setAttribute('open', '');
      });
    mountDialog();
    await open();
    expect(showModal).toHaveBeenCalled();
    // Empty when shown is what sent focus to the dialog element and left the label dangling.
    expect(childrenWhenShown).toBeGreaterThan(0);
  });

  it('says that it copied, for a reader who cannot see the button change', async () => {
    mountDialog();
    await open();
    const status = screen.getByRole('status');
    expect(status.textContent).toBe('');
    await userEvent.click(screen.getByRole('button', { name: 'Copy text' }));
    await waitFor(() => {
      expect(status.textContent).toBe('Copied');
    });
  });

  it('keeps offering to share when the reader just dismissed the system sheet', async () => {
    const share = vi.fn(() => Promise.reject(new DOMException('cancelled', 'AbortError')));
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    mountDialog();
    await open();
    await userEvent.click(await screen.findByRole('button', { name: 'Share' }));
    await waitFor(() => {
      expect(share).toHaveBeenCalled();
    });
    expect(screen.getByRole('button', { name: 'Share' })).toBeTruthy();
  });

  /** A button that has already failed once and would fail again is worse than no button. */
  it('stops offering to share once the platform has refused the picture', async () => {
    const share = vi.fn(() => Promise.reject(new DOMException('nope', 'NotAllowedError')));
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true });
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    mountDialog();
    await open();
    await userEvent.click(await screen.findByRole('button', { name: 'Share' }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Share' })).toBeNull();
    });
    // And the ways of keeping it that do work are still there.
    expect(screen.getByRole('link', { name: /Save image/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy text' })).toBeTruthy();
  });

  it('closes when the reader taps outside the card, and not when they tap it', async () => {
    mountDialog();
    await open();
    const dialog = document.querySelector('dialog');
    if (!dialog) throw new Error('no dialog');
    // happy-dom measures everything as zero, so the card is given a rect to be outside of.
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      right: 300,
      bottom: 400,
      left: 100,
    } as DOMRect);
    const tap = (clientX: number, clientY: number) => {
      dialog.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX, clientY, detail: 1 }));
    };
    tap(200, 250); // on the card
    expect(dialog.open).toBe(true);
    tap(20, 20); // on the backdrop
    await waitFor(() => {
      expect(dialog.open).toBe(false);
    });
  });

  it('lets the card go when it closes, rather than holding a bitmap per verse', async () => {
    mountDialog();
    await open();
    await screen.findByRole('img', { name: /John 3:16/ });
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => {
      expect(revoked).toContain('blob:card');
    });
  });
});
