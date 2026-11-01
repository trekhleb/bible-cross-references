import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { versePassage, type Passage } from '../../../core/bible/passage.ts';
import { CANONICAL_VERSIFICATION } from '../../../core/bible/versification.ts';
import { createTranslationFile, verseIndex } from '../../../test-utils/fixtures.ts';
import { createVizData } from '../../../test-utils/viz-data.ts';
import { getTranslationManifest } from '../../../translations/registry.ts';
import { Translation } from '../../../translations/translation.ts';
import { DEFAULT_LINK_FILTER } from '../link-filter.ts';
import { PassagePanel } from './PassagePanel.tsx';

const JOHN_3_16 = verseIndex('John', 3, 16);
const JOHN_3_17 = verseIndex('John', 3, 17);
const ROM_5_8 = verseIndex('Rom', 5, 8);
const GEN_1_1 = verseIndex('Gen', 1, 1);

const DATA = createVizData(
  [
    { from: JOHN_3_16, to: ROM_5_8, votes: 50 },
    { from: GEN_1_1, to: JOHN_3_16, votes: 30 },
  ],
  new Map([
    [JOHN_3_16, 'For God so loved the world…'],
    [ROM_5_8, 'But God proves His love…'],
    [GEN_1_1, 'In the beginning…'],
    [JOHN_3_17, 'For God did not send His Son…'],
  ]),
);

function renderPanel(passage: Passage = versePassage(JOHN_3_16), props = {}) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const result = render(
    <PassagePanel
      data={DATA}
      passage={passage}
      filter={DEFAULT_LINK_FILTER}
      onSelect={onSelect}
      onClose={onClose}
      shareUrl={(target) => `https://example.org/?ref=${target.kind}`}
      {...props}
    />,
  );
  return { ...result, onSelect, onClose };
}

describe('PassagePanel', () => {
  it('names the passage, its book and its genre', () => {
    renderPanel();
    expect(screen.getByRole('heading', { name: 'John 3:16' })).toBeDefined();
    expect(screen.getByText(/Gospels/)).toBeDefined();
  });

  it("shows a verse's text", () => {
    renderPanel();
    expect(screen.getByText('For God so loved the world…')).toBeDefined();
  });

  it('lists where the passage points, and what points at it', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /References/ })).toBeDefined();
    expect(screen.getByRole('button', { name: /Referenced by/ })).toBeDefined();
    expect(screen.getByText(/But God proves His love/)).toBeDefined();
    expect(screen.getByText(/In the beginning/)).toBeDefined();
  });

  it('follows a reference when it is chosen', async () => {
    const { onSelect } = renderPanel();
    await userEvent.click(
      screen.getByText(/But God proves His love/).closest('button') as HTMLElement,
    );
    expect(onSelect).toHaveBeenCalledWith(versePassage(ROM_5_8));
  });

  it('closes', async () => {
    const { onClose } = renderPanel();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('steps to the next and previous verse', async () => {
    const { onSelect } = renderPanel();
    await userEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(onSelect).toHaveBeenCalledWith(versePassage(JOHN_3_17));
    await userEvent.click(screen.getByRole('button', { name: /Previous/i }));
    expect(onSelect).toHaveBeenCalledWith(versePassage(verseIndex('John', 3, 15)));
  });

  it('says so when a passage has no links in a direction', () => {
    renderPanel(versePassage(verseIndex('Rev', 22, 21)));
    expect(screen.getAllByText('None').length).toBeGreaterThan(0);
  });

  it('shows a chapter as a list of its verses', () => {
    renderPanel({ kind: 'chapter', book: 'John', chapter: 3 });
    expect(screen.getByRole('button', { name: /Verses/ })).toBeDefined();
    expect(screen.getByText('For God so loved the world…')).toBeDefined();
  });

  it("opens a verse from a chapter's list", async () => {
    const { onSelect } = renderPanel({ kind: 'chapter', book: 'John', chapter: 3 });
    await userEvent.click(
      screen.getByText('For God so loved the world…').closest('button') as HTMLElement,
    );
    expect(onSelect).toHaveBeenCalledWith(versePassage(JOHN_3_16));
  });

  it('shows the genre breakdown of where a passage connects', () => {
    renderPanel();
    expect(screen.getByRole('button', { name: /Connects to/ })).toBeDefined();
  });

  it('shows actions the host gives it', () => {
    renderPanel(versePassage(JOHN_3_16), {
      actions: <button type="button">Read in context</button>,
    });
    expect(screen.getByRole('button', { name: 'Read in context' })).toBeDefined();
  });

  it('previews a connection when one is pointed at, and stops when it is not', async () => {
    const onPreview = vi.fn();
    renderPanel(versePassage(JOHN_3_16), { onPreview });
    const row = screen.getByText(/But God proves His love/).closest('[class*="quotable"]');
    await userEvent.hover(row as HTMLElement);
    await userEvent.unhover(row as HTMLElement);
    expect(onPreview).toHaveBeenCalledWith(null);
  });

  it('notes a verse the translation leaves out', () => {
    const data = createVizData([], new Map([[verseIndex('Matt', 17, 21), '']]));
    render(
      <PassagePanel
        data={data}
        passage={versePassage(verseIndex('Matt', 17, 21))}
        filter={DEFAULT_LINK_FILTER}
        onSelect={vi.fn()}
        onClose={vi.fn()}
        shareUrl={() => 'https://example.org/'}
      />,
    );
    expect(screen.getByText(/Omitted in the BSB/)).toBeDefined();
  });

  describe('other translations, on bible.com', () => {
    it('offers the verse in the ESV, the NASB 1995 and the NLT, one click each', () => {
      renderPanel();
      const group = screen.getByRole('group', { name: 'Read on bible.com' });
      const links = within(group).getAllByRole('link');
      expect(links.map((link) => link.textContent)).toEqual(['ESV', 'NASB 1995', 'NLT']);
      expect(links.map((link) => link.getAttribute('href'))).toEqual([
        'https://www.bible.com/bible/59/JHN.3.16.ESV',
        'https://www.bible.com/bible/100/JHN.3.16.NASB1995',
        'https://www.bible.com/bible/116/JHN.3.16.NLT',
      ]);
    });

    /**
     * Plain links that leave the app: a tab of their own, so the reader's place here survives,
     * and no referrer, so the site learns nothing about where the reader came from.
     */
    it('opens them in a new tab, telling the other site nothing', () => {
      renderPanel();
      const group = screen.getByRole('group', { name: 'Read on bible.com' });
      for (const link of within(group).getAllByRole('link')) {
        expect(link.getAttribute('target')).toBe('_blank');
        expect(link.getAttribute('rel')?.split(' ')).toContain('noreferrer');
      }
    });

    /**
     * The name starts with the link's own text: what a voice-control user says to follow it, and
     * what tells the three apart in a screen reader's list of links.
     */
    it('says in full to a screen reader which passage opens where, and names it on hover', () => {
      renderPanel();
      const esv = screen.getByRole('link', {
        name: 'ESV: read John 3:16 in the English Standard Version on bible.com, in a new tab',
      });
      expect(esv.getAttribute('title')).toBe('English Standard Version');
    });

    it('offers a whole chapter the same way', () => {
      renderPanel({ kind: 'chapter', book: 'John', chapter: 3 });
      expect(screen.getByRole('link', { name: /NASB 1995/ }).getAttribute('href')).toBe(
        'https://www.bible.com/bible/100/JHN.3.NASB1995',
      );
    });

    it('sits under the actions the host gives, in the same row of ways to open the passage', () => {
      renderPanel(versePassage(JOHN_3_16), {
        actions: <button type="button">Read in context</button>,
      });
      const host = screen.getByRole('button', { name: 'Read in context' });
      expect(host.nextElementSibling).toBe(
        screen.getByRole('group', { name: 'Read on bible.com' }),
      );
    });

    describe('beside a text in another language', () => {
      const PORTUGUESE = {
        ...DATA,
        translation: new Translation(
          getTranslationManifest('blivre'),
          CANONICAL_VERSIFICATION,
          createTranslationFile(new Map([[JOHN_3_16, 'Porque Deus amou o mundo…']])),
        ),
      };

      it('offers nothing, rather than links in a language the reader may not read', () => {
        renderPanel(versePassage(JOHN_3_16), { data: PORTUGUESE });
        expect(screen.getByText('Porque Deus amou o mundo…')).toBeDefined();
        expect(screen.queryByRole('group', { name: 'Read on bible.com' })).toBeNull();
        expect(screen.queryByRole('link', { name: /bible\.com/ })).toBeNull();
      });

      it("still shows the host's own actions, on their own", () => {
        renderPanel(versePassage(JOHN_3_16), {
          data: PORTUGUESE,
          actions: <button type="button">Read in context</button>,
        });
        const host = screen.getByRole('button', { name: 'Read in context' });
        expect(host.nextElementSibling).toBeNull();
      });
    });
  });
});
