import { t } from '../../../locales/ui.ts';
import { useEffect, useState } from 'react';
import { formatPassage, versePassage, type Passage } from '../../../core/bible/passage.ts';
import type { VerseIndex } from '../../../core/bible/verse-ref.ts';
import { ExpandIcon, WordsIcon } from '../../../shared/ui/icons.tsx';
import { formatInteger } from '../../../shared/lib/format.ts';
import { verseTextOrNote } from '../../../translations/verse-text.ts';
import type { OriginalWordsDataset } from '../../../words/load-original-words.ts';
import { originalWordsIfLoaded, originalWordsLoader, resetOriginalWords } from '../viz-data.ts';
import { PanelSection } from './PanelSection.tsx';
import type { VizData } from '../viz-data.ts';
import styles from './PassagePanel.module.css';

/** How many of a verse's words to list before the rest are a click away. */
const INITIAL_WORDS = 6;

/**
 * The words are the one part of the app that is not downloaded until it is wanted: a reader who
 * never opens a verse never pays for it. `null` until it arrives, which is when the section
 * appears; a failed download leaves the panel exactly as it was.
 */
function useOriginalWords(): OriginalWordsDataset | null {
  const [words, setWords] = useState<OriginalWordsDataset | null>(originalWordsIfLoaded);
  useEffect(() => {
    if (words) {
      return undefined;
    }
    let current = true;
    originalWordsLoader.load().then(
      (loaded) => {
        if (current) {
          setWords(loaded);
        }
      },
      () => {
        // A download that failed should not settle the question for the whole visit: forgetting
        // it means the next verse the reader opens asks again.
        resetOriginalWords();
      },
    );
    return () => {
      current = false;
    };
  }, [words]);
  return words;
}

/**
 * The dictionary words of a verse, and the other verses that use them.
 *
 * This is a different kind of link from the cross-references above it, and is kept apart from
 * them on purpose: a cross-reference is somebody's judgement that two passages belong together,
 * while this is the plain fact that they share a word. Rare words first, since a word used in
 * three places says something about those places and one used in a hundred says much less.
 */
export function OriginalWordsSection({
  verse,
  data,
  onSelect,
}: {
  readonly verse: VerseIndex;
  readonly data: VizData;
  readonly onSelect: (passage: Passage) => void;
}) {
  const words = useOriginalWords();
  const [expanded, setExpanded] = useState(false);
  const [openWord, setOpenWord] = useState<number | null>(null);
  const { versification, translation } = data;

  if (!words) {
    return null;
  }
  const inVerse = words.index.wordsOf(verse);
  if (inVerse.length === 0) {
    return null;
  }
  const language = versification.bookAt(verse).testament === 'OT' ? 'Hebrew' : 'Greek';
  const visible = expanded ? inVerse : inVerse.slice(0, INITIAL_WORDS);

  return (
    <>
      <PanelSection
        id="same-word"
        icon={WordsIcon}
        title={t(language === 'Hebrew' ? 'Same Hebrew word' : 'Same Greek word')}
        description={t('where else it is used')}
        count={inVerse.length}
        countLabel={t('words')}
      >
        {visible.map((word) => {
          const open = openWord === word.index;
          return (
            <div key={word.strongs} className={styles.group}>
              <button
                type="button"
                className={`${styles.item} ${styles.word}`}
                aria-expanded={open}
                onClick={() => {
                  setOpenWord(open ? null : word.index);
                }}
              >
                <span className={styles.itemRef}>
                  <strong lang={language === 'Hebrew' ? 'he' : 'el'}>{word.lemma}</strong>
                  <span className={styles.wordSound}>{word.transliteration}</span>
                  <span className={styles.count}>{formatInteger(word.verseCount)}</span>
                  <ExpandIcon className={styles.chevron} />
                </span>
                <span className={styles.snippet}>{word.gloss}</span>
              </button>
              {open &&
                words.index.versesOf(word.index).map((other) => (
                  <button
                    key={other}
                    type="button"
                    className={`${styles.item} ${styles.wordVerse}`}
                    aria-current={other === verse ? 'true' : undefined}
                    onClick={() => {
                      onSelect(versePassage(other));
                    }}
                  >
                    <span className={styles.itemRef}>
                      <strong>{formatPassage(versePassage(other), versification)}</strong>
                    </span>
                    <span className={styles.snippet}>{verseTextOrNote(translation, other)}</span>
                  </button>
                ))}
            </div>
          );
        })}
        {!expanded && inVerse.length > INITIAL_WORDS && (
          <button
            type="button"
            className={styles.more}
            onClick={() => {
              setExpanded(true);
            }}
          >
            {t('Show {count} more', { count: formatInteger(inVerse.length - INITIAL_WORDS) })}
          </button>
        )}
      </PanelSection>
      {/* Outside the section's body: the credit is a condition of using the data, so it does
          not go away when a reader folds the words out of sight. */}
      <p className={styles.credit}>
        {t('Words:')}{' '}
        <a href={words.manifest.homepage} target="_blank" rel="noreferrer">
          STEP Bible
        </a>{' '}
        (
        <a href={words.manifest.license.url} target="_blank" rel="noreferrer">
          {words.manifest.license.name}
        </a>
        {t(
          '), based on work at Tyndale House, Cambridge; reduced to dictionary forms. Words used in more than {count} verses are left out.',
          { count: formatInteger(words.maxVerses) },
        )}
      </p>
    </>
  );
}
