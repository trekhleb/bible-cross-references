import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../../core/bible/versification.ts';
import type { OriginalWordColumns } from '../../../core/datasets/formats.ts';
import { createTranslationFile, verseIndex } from '../../../test-utils/fixtures.ts';
import { getTranslationManifest } from '../../../translations/registry.ts';
import { Translation } from '../../../translations/translation.ts';
import { getWordSourceManifest } from '../../../words/registry.ts';
import { OriginalWordIndex } from '../../../words/original-words.ts';
import type { OriginalWordsDataset } from '../../../words/load-original-words.ts';
import { WordOccurrences } from '../../../words/load-word-occurrences.ts';
import type { Connection } from '../connections.ts';
import { LinkEvidence, linkMarks, markedText, useLinkWords } from './LinkEvidence.tsx';
import { linkEvidence } from '../../../words/link-evidence.ts';
import { alignerFor } from '../../../words/translation-alignment.ts';

const GEN_1_1 = verseIndex('Gen', 1, 1);
const PS_4_8 = verseIndex('Ps', 4, 8);
const JOHN_1_14 = verseIndex('John', 1, 14);
const JOHN_3_16 = verseIndex('John', 3, 16);
const JOHN_14_27 = verseIndex('John', 14, 27);

/** μονογενής in two verses of John; "peace" once in Greek and once in Hebrew. */
function columns(): OriginalWordColumns {
  return {
    strongs: ['G1515', 'G3439', 'H7965'],
    lemma: ['εἰρήνη', 'μονογενής', 'שָׁלוֹם'],
    transliteration: ['eirēnē', 'monogenēs', 'shalom'],
    gloss: ['peace', 'only begotten', 'peace / friendship'],
    offsets: [0, 1, 3, 4],
    verses: [JOHN_14_27, JOHN_1_14, JOHN_3_16, PS_4_8].map(Number),
  };
}

function dataset(): OriginalWordsDataset {
  return {
    manifest: getWordSourceManifest('stepbible'),
    provenance: { url: 'x', sha256: 'a'.repeat(64), retrievedAt: '2026-01-01', snapshotDate: null },
    notices: [],
    maxVerses: 100,
    contentWordMaxVerses: 100,
    index: new OriginalWordIndex(columns(), CANONICAL_VERSIFICATION.verseCount),
  };
}

function occurrences(): WordOccurrences {
  return new WordOccurrences({
    grammar: ['N-ASF', 'A-GSM', 'A-ASM', 'HNcmsa'],
    grammarAt: [0, 1, 2, 3],
    english: ['peace', 'of an only begotten', 'only begotten', 'peace'],
  });
}

const state = vi.hoisted(() => ({
  words: null as OriginalWordsDataset | null,
  occurrencesFail: false,
  reset: vi.fn(),
}));

vi.mock('../viz-data.ts', () => ({
  originalWordsIfLoaded: () => state.words,
  originalWordsLoader: { load: () => Promise.resolve(dataset()), reset: vi.fn() },
  resetOriginalWords: vi.fn(),
  wordOccurrencesLoader: {
    load: () =>
      state.occurrencesFail ? Promise.reject(new Error('offline')) : Promise.resolve(occurrences()),
    reset: state.reset,
  },
}));

beforeEach(() => {
  state.words = dataset();
  state.occurrencesFail = false;
  state.reset.mockClear();
});

function connection(here: number, otherStart: number, otherEnd = otherStart): Connection {
  return { here, otherStart, otherEnd, direction: 'outgoing' } as unknown as Connection;
}

/** The verses' text: the words that render the shared ones, among words every verse has. */
const translation = new Translation(
  getTranslationManifest('ubg'),
  CANONICAL_VERSIFICATION,
  createTranslationFile(
    new Map([
      [JOHN_3_16, 'Verse dał swego jednorodzonego Syna'],
      [JOHN_1_14, 'Verse chwałę jako jednorodzonego od Ojca'],
      [PS_4_8, 'Verse pokoju'],
      [JOHN_14_27, 'Verse Pokój'],
    ]),
  ),
);

function Harness({ link }: { readonly link: Connection }) {
  const words = useLinkWords(link, translation);
  return (
    <LinkEvidence
      connection={link}
      link={words}
      translation={translation}
      versification={CANONICAL_VERSIFICATION}
    />
  );
}

function show(link: Connection) {
  return render(<Harness link={link} />);
}

describe('LinkEvidence', () => {
  it('names the word two passages share, and opens on how each uses it', async () => {
    show(connection(JOHN_3_16, JOHN_1_14));
    const badge = screen.getByRole('button', { name: /shared word · jednorodzonego/ });
    expect(badge.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(badge);
    expect(badge.getAttribute('aria-expanded')).toBe('true');
    expect(await screen.findByText('of an only begotten')).toBeTruthy();
    expect(screen.getByText(/adjective, accusative, singular, masculine/)).toBeTruthy();
    // Each passage shows the translation's own word for it, marked in its sentence.
    expect(screen.getAllByText('jednorodzonego', { selector: 'mark' })).toHaveLength(2);
    expect(screen.getByText('in 2 verses of the Bible')).toBeTruthy();
  });

  it('falls back to words that mean the same across the Testaments', async () => {
    show(connection(PS_4_8, JOHN_14_27));
    const badge = screen.getByRole('button', { name: /same meaning · pokoju/ });
    await userEvent.click(badge);
    expect(await screen.findByText(/noun, masculine, singular, absolute/)).toBeTruthy();
    expect(screen.getByText(/noun, accusative, singular, feminine/)).toBeTruthy();
  });

  it('says a link has no word in common, and why it is there anyway', async () => {
    show(connection(GEN_1_1, JOHN_1_14));
    await userEvent.click(screen.getByRole('button', { name: /thematic/ }));
    expect(screen.getByText(/Treasury of Scripture Knowledge/)).toBeTruthy();
  });

  it('keeps waiting rather than failing when the uses cannot be fetched', async () => {
    state.occurrencesFail = true;
    show(connection(JOHN_3_16, JOHN_1_14));
    await userEvent.click(screen.getByRole('button', { name: /shared word/ }));
    await waitFor(() => {
      expect(state.reset).toHaveBeenCalled();
    });
    expect(screen.getAllByText('Loading how the words are used…')).toHaveLength(2);
  });

  it('shows nothing until the words have arrived', () => {
    state.words = null;
    const { container } = show(connection(JOHN_3_16, JOHN_1_14));
    expect(container.innerHTML).toBe('');
  });
});

describe('linkMarks', () => {
  function link(here: number, otherStart: number) {
    const words = dataset();
    return {
      evidence: linkEvidence(words.index, here, otherStart, otherStart),
      index: words.index,
      aligner: alignerFor(translation, words.index, CANONICAL_VERSIFICATION.verseCount),
    };
  }

  it('finds the translation’s word for what a linked verse shares with the one being read', () => {
    expect(linkMarks(link(JOHN_3_16, JOHN_1_14), JOHN_1_14).map((span) => span.text)).toEqual([
      'jednorodzonego',
    ]);
  });

  it('marks the word of the other language that means the same', () => {
    expect(linkMarks(link(PS_4_8, JOHN_14_27), JOHN_14_27).map((span) => span.text)).toEqual([
      'Pokój',
    ]);
  });

  it('marks nothing where nothing is shared', () => {
    expect(linkMarks(link(GEN_1_1, JOHN_1_14), JOHN_1_14)).toEqual([]);
  });
});

describe('markedText', () => {
  it('marks the given words and keeps the rest of the text as it is', () => {
    const { container } = render(
      <p>
        {markedText('dał swego jednorodzonego Syna', [
          { start: 10, end: 24, text: 'jednorodzonego' },
        ])}
      </p>,
    );
    expect(container.textContent).toBe('dał swego jednorodzonego Syna');
    expect(container.querySelector('mark')?.textContent).toBe('jednorodzonego');
  });

  it('leaves a text with nothing to mark untouched', () => {
    expect(markedText('Verse', [])).toBe('Verse');
  });
});
