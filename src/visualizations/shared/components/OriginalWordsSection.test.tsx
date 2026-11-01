import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../../core/bible/versification.ts';
import type { OriginalWordColumns } from '../../../core/datasets/formats.ts';
import { createTranslationFile, verseIndex } from '../../../test-utils/fixtures.ts';
import { getTranslationManifest } from '../../../translations/registry.ts';
import { Translation } from '../../../translations/translation.ts';
import { getWordSourceManifest } from '../../../words/registry.ts';
import { OriginalWordIndex } from '../../../words/original-words.ts';
import type { OriginalWordsDataset } from '../../../words/load-original-words.ts';
import { computeVerseGenres } from '../verse-genres.ts';
import type { VizData } from '../viz-data.ts';
import { OriginalWordsSection } from './OriginalWordsSection.tsx';

const GEN_1_1 = verseIndex('Gen', 1, 1);
const GEN_49_3 = verseIndex('Gen', 49, 3);
const ACTS_5_14 = verseIndex('Acts', 5, 14);
const LUKE_5_6 = verseIndex('Luke', 5, 6);

/** Two Hebrew words in Genesis, and one Greek word shared by Luke and Acts. */
function columns(): OriginalWordColumns {
  return {
    strongs: ['G4128', 'H1254A', 'H7225G'],
    lemma: ['πλῆθος', 'בָּרָא', 'רֵאשִׁית'],
    transliteration: ['plēthos', 'bara', 'reshit'],
    gloss: ['multitude', 'to create', 'beginning'],
    offsets: [0, 2, 3, 5],
    verses: [LUKE_5_6, ACTS_5_14, GEN_1_1, GEN_1_1, GEN_49_3].map(Number),
  };
}

function dataset(): OriginalWordsDataset {
  return {
    manifest: getWordSourceManifest('stepbible'),
    provenance: {
      url: 'https://example.org',
      sha256: 'a'.repeat(64),
      retrievedAt: '2026-01-01',
      snapshotDate: null,
    },
    notices: [],
    maxVerses: 100,
    contentWordMaxVerses: 100,
    index: new OriginalWordIndex(columns(), CANONICAL_VERSIFICATION.verseCount),
  };
}

const data = {
  versification: CANONICAL_VERSIFICATION,
  translation: new Translation(
    getTranslationManifest('bsb'),
    CANONICAL_VERSIFICATION,
    createTranslationFile(),
  ),
  verseGenres: computeVerseGenres(CANONICAL_VERSIFICATION),
} as unknown as VizData;

// `vi.mock` is hoisted above the file, so its state has to be hoisted with it.
const state = vi.hoisted(() => ({
  loaded: null as OriginalWordsDataset | null,
  shouldFail: false,
  reset: vi.fn(),
}));

vi.mock('../viz-data.ts', () => ({
  originalWordsIfLoaded: () => state.loaded,
  originalWordsLoader: {
    load: () =>
      state.shouldFail ? Promise.reject(new Error('offline')) : Promise.resolve(dataset()),
    reset: state.reset,
  },
  resetOriginalWords: () => {
    state.loaded = null;
    state.reset();
  },
}));

beforeEach(() => {
  state.loaded = null;
  state.shouldFail = false;
  state.reset.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderSection(verse = GEN_1_1) {
  return render(<OriginalWordsSection verse={verse} data={data} onSelect={vi.fn()} />);
}

describe('OriginalWordsSection', () => {
  it('shows nothing until the words have arrived', () => {
    const { container } = renderSection();
    expect(container.textContent).toBe('');
  });

  it('appears once they have', async () => {
    renderSection();
    expect(await screen.findByText(/SAME HEBREW WORD|Same Hebrew word/i)).toBeDefined();
  });

  it('says Hebrew in the Old Testament and Greek in the New', async () => {
    const { unmount } = renderSection(GEN_1_1);
    expect(await screen.findByRole('heading', { name: /Hebrew/i })).toBeDefined();
    unmount();
    state.loaded = dataset();
    renderSection(ACTS_5_14);
    expect(await screen.findByRole('heading', { name: /Greek/i })).toBeDefined();
  });

  it("lists the verse's words, rarest first, with how it sounds and what it means", async () => {
    renderSection(GEN_1_1);
    const words = await screen.findAllByRole('button', { name: /bara|reshit/ });
    expect(words[0]?.textContent).toContain('בָּרָא');
    expect(words[0]?.textContent).toContain('bara');
    expect(words[0]?.textContent).toContain('to create');
  });

  it('marks the original script, so a screen reader says it correctly', async () => {
    renderSection(GEN_1_1);
    await screen.findAllByRole('button', { name: /bara/ });
    expect(document.querySelector('strong[lang="he"]')).not.toBeNull();
  });

  it('opens a word to show every verse that uses it', async () => {
    renderSection(ACTS_5_14);
    const word = await screen.findByRole('button', { name: /plēthos/ });
    await userEvent.click(word);
    expect(screen.getByText(/Luke 5:6/)).toBeDefined();
    expect(word.getAttribute('aria-expanded')).toBe('true');
  });

  it('closes it again', async () => {
    renderSection(ACTS_5_14);
    const word = await screen.findByRole('button', { name: /plēthos/ });
    await userEvent.click(word);
    await userEvent.click(word);
    expect(screen.queryByText(/Luke 5:6/)).toBeNull();
  });

  it('opens one word at a time', async () => {
    renderSection(GEN_1_1);
    const [first, second] = await screen.findAllByRole('button', { name: /bara|reshit/ });
    if (!first || !second) {
      throw new Error('Expected both words of the verse.');
    }
    await userEvent.click(first);
    await userEvent.click(second);
    expect(first.getAttribute('aria-expanded')).toBe('false');
    expect(second.getAttribute('aria-expanded')).toBe('true');
  });

  it('follows a verse when it is chosen', async () => {
    const onSelect = vi.fn();
    render(<OriginalWordsSection verse={ACTS_5_14} data={data} onSelect={onSelect} />);
    await userEvent.click(await screen.findByRole('button', { name: /plēthos/ }));
    await userEvent.click(screen.getByText(/Luke 5:6/).closest('button') as HTMLElement);
    expect(onSelect).toHaveBeenCalledWith({ kind: 'verse', verse: LUKE_5_6 });
  });

  it('marks the verse being read, among the others', async () => {
    renderSection(ACTS_5_14);
    await userEvent.click(await screen.findByRole('button', { name: /plēthos/ }));
    expect(document.querySelector('[aria-current="true"]')?.textContent).toContain('Acts 5:14');
  });

  it('credits the source, and says what was left out', async () => {
    renderSection();
    expect(await screen.findByText(/STEP Bible/)).toBeDefined();
    expect(screen.getByText(/Tyndale House/)).toBeDefined();
    expect(screen.getByText(/more than 100 verses are left out/)).toBeDefined();
  });

  it('keeps the credit visible when the section is folded away', async () => {
    renderSection();
    const band = await screen.findByRole('button', { name: /Same Hebrew word/i });
    await userEvent.click(band);
    expect(screen.getByText(/STEP Bible/)).toBeDefined();
  });

  it('shows nothing for a verse with no words of its own', async () => {
    state.loaded = dataset();
    const { container } = render(
      <OriginalWordsSection verse={verseIndex('Rev', 22, 21)} data={data} onSelect={vi.fn()} />,
    );
    await waitFor(() => {
      expect(container.textContent).toBe('');
    });
  });

  it('forgets a failed download, so the next verse tries again', async () => {
    state.shouldFail = true;
    renderSection();
    await waitFor(() => {
      expect(state.reset).toHaveBeenCalled();
    });
  });
});
