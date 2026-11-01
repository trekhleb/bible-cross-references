import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { formatVerseRef } from '../../../core/bible/reference-format.ts';
import type { VerseIndex } from '../../../core/bible/verse-ref.ts';
import type { Versification } from '../../../core/bible/versification.ts';
import { useLocalization } from '../../../i18n/use-locale.tsx';
import { ExpandIcon } from '../../../shared/ui/icons.tsx';
import type { Translation } from '../../../translations/translation.ts';
import { localizedGloss, useGlosses, type GlossTable } from '../../../words/glosses.ts';
import { describeGrammar } from '../../../words/grammar.ts';
import { linkEvidence, type LinkEvidence as Evidence } from '../../../words/link-evidence.ts';
import type { WordOccurrences } from '../../../words/load-word-occurrences.ts';
import type { OriginalWord, OriginalWordIndex } from '../../../words/original-words.ts';
import {
  alignerFor,
  type AlignedSpan,
  type TranslationAligner,
} from '../../../words/translation-alignment.ts';
import type { Connection } from '../connections.ts';
import { wordOccurrencesLoader } from '../viz-data.ts';
import { useOriginalWords } from './OriginalWordsSection.tsx';
import styles from './PassagePanel.module.css';

/** How many words of the verse to show either side of a marked one. */
const CONTEXT_WORDS = 6;

/** The words on each side of a link, compared, with the translation's own words for them. */
export interface LinkWords {
  readonly evidence: Evidence;
  readonly index: OriginalWordIndex;
  readonly aligner: TranslationAligner;
}

/** What links the two ends of a connection, once the words have arrived; `null` until then. */
export function useLinkWords(connection: Connection, translation: Translation): LinkWords | null {
  const index = useOriginalWords()?.index ?? null;
  const verseCount = translation.versification.verseCount;
  return useMemo(() => {
    if (!index) {
      return null;
    }
    return {
      evidence: linkEvidence(index, connection.here, connection.otherStart, connection.otherEnd),
      index,
      aligner: alignerFor(translation, index, verseCount),
    };
  }, [index, translation, verseCount, connection.here, connection.otherStart, connection.otherEnd]);
}

/** The original words that make the evidence, on this end of the link and on the other. */
function evidenceWords(evidence: Evidence): {
  readonly here: readonly OriginalWord[];
  readonly there: readonly OriginalWord[];
} {
  if (evidence.kind === 'shared-word') {
    return { here: evidence.words, there: evidence.words };
  }
  if (evidence.kind === 'same-meaning') {
    return {
      here: evidence.pairs.map((pair) => pair.here),
      there: evidence.pairs.map((pair) => pair.there),
    };
  }
  return { here: [], there: [] };
}

/** Where the words linking a passage to the verse being read stand in one of its verses. */
export function linkMarks(link: LinkWords, verse: VerseIndex): readonly AlignedSpan[] {
  const wanted = new Set(evidenceWords(link.evidence).there.map((word) => word.index));
  return [...link.aligner.align(verse)]
    .filter(([word]) => wanted.has(word))
    .map(([, span]) => span);
}

/** A verse's text with some of its words marked. */
export function markedText(text: string, spans: readonly AlignedSpan[]): ReactNode {
  if (spans.length === 0) {
    return text;
  }
  const pieces: ReactNode[] = [];
  let at = 0;
  for (const span of [...spans].sort((a, b) => a.start - b.start)) {
    pieces.push(text.slice(at, span.start), <mark key={span.start}>{span.text}</mark>);
    at = span.end;
  }
  pieces.push(text.slice(at));
  return pieces.map((piece, position) => <Fragment key={position}>{piece}</Fragment>);
}

/** The few words around a marked one: enough to read it in its sentence, short enough to scan. */
function excerpt(text: string, span: AlignedSpan): ReactNode {
  const before = text.slice(0, span.start).split(/\s+/);
  const after = text.slice(span.end).split(/\s+/);
  const head = before.slice(-CONTEXT_WORDS - 1).join(' ');
  const tail = after.slice(0, CONTEXT_WORDS + 1).join(' ');
  return (
    <>
      {before.length > CONTEXT_WORDS + 1 && '…'}
      {head}
      <mark>{span.text}</mark>
      {tail}
      {after.length > CONTEXT_WORDS + 1 && '…'}
    </>
  );
}

/** The occurrences, fetched the first time a reader opens any link's evidence. */
function useWordOccurrences(wanted: boolean): WordOccurrences | null {
  const [occurrences, setOccurrences] = useState<WordOccurrences | null>(null);
  useEffect(() => {
    if (!wanted || occurrences) {
      return undefined;
    }
    let current = true;
    wordOccurrencesLoader.load().then(
      (loaded) => {
        if (current) {
          setOccurrences(loaded);
        }
      },
      () => {
        // Forgotten, so opening the evidence again asks again; the summary is still shown.
        wordOccurrencesLoader.reset();
      },
    );
    return () => {
      current = false;
    };
  }, [wanted, occurrences]);
  return occurrences;
}

function scriptOf(word: OriginalWord): { readonly lang: string; readonly dir: 'rtl' | 'ltr' } {
  return word.strongs.startsWith('H') ? { lang: 'he', dir: 'rtl' } : { lang: 'el', dir: 'ltr' };
}

/**
 * How a word is used in one verse: the verse's own words around the translation's word for it,
 * then its grammar and the English the tagging gives it.
 */
function WordUseLine({
  word,
  verse,
  link,
  translation,
  occurrences,
  versification,
}: {
  readonly word: OriginalWord;
  readonly verse: VerseIndex;
  readonly link: LinkWords;
  readonly translation: Translation;
  readonly occurrences: WordOccurrences | null;
  readonly versification: Versification;
}) {
  const { t, books, locale } = useLocalization();
  const entry = link.index.entryOf(word.index, verse);
  const use = occurrences && entry !== null ? occurrences.useAt(entry) : null;
  const span = link.aligner.align(verse).get(word.index);
  return (
    <div className={styles.evidenceUse}>
      <span className={styles.evidenceUseRef}>
        {formatVerseRef(versification.refAt(verse), books)}
      </span>
      {span && (
        <span
          className={styles.evidenceExcerpt}
          lang={translation.manifest.language}
          dir={translation.manifest.direction}
        >
          {excerpt(translation.verseText(verse), span)}
        </span>
      )}
      {use ? (
        <span className={styles.muted}>
          {describeGrammar(use.grammar, locale.id)} · <span lang="en">{use.english}</span>
        </span>
      ) : (
        <span className={styles.muted}>{t('evidence.loading')}</span>
      )}
    </div>
  );
}

/** The dictionary word: its form, how it is said, what it means and how rare it is. */
function WordHeading({
  word,
  glosses,
}: {
  readonly word: OriginalWord;
  readonly glosses: GlossTable | null;
}) {
  const { t, n } = useLocalization();
  const { lang, dir } = scriptOf(word);
  return (
    <p className={styles.evidenceWord}>
      <strong lang={lang} dir={dir}>
        {word.lemma}
      </strong>
      <span className={styles.wordSound}>{word.transliteration}</span>
      <span>{localizedGloss(word, glosses)}</span>
      <span className={styles.count}>
        {t('evidence.verses')(n(word.verseCount), word.verseCount)}
      </span>
    </p>
  );
}

/** The first verse of a linked passage that uses a word. */
function firstVerseWith(
  word: OriginalWord,
  index: OriginalWordIndex,
  start: VerseIndex,
  end: VerseIndex,
) {
  for (let verse = start; verse <= end; verse += 1) {
    if (index.entryOf(word.index, verse) !== null) {
      return verse;
    }
  }
  return start;
}

/**
 * What links a passage to one of its cross-references, in the original languages: a badge that
 * names the words they share as the reader's translation renders them in the verse being read,
 * opening on every one of those words — each in its own verse, with its grammar.
 */
export function LinkEvidence({
  connection,
  link,
  translation,
  versification,
}: {
  readonly connection: Connection;
  readonly link: LinkWords | null;
  readonly translation: Translation;
  readonly versification: Versification;
}) {
  const { t, locale } = useLocalization();
  const glosses = useGlosses(locale.id);
  const [open, setOpen] = useState(false);
  const occurrences = useWordOccurrences(open);
  if (!link) {
    return null;
  }
  const { evidence, index, aligner } = link;
  const here = aligner.align(connection.here);
  // The translation's own word where it could be found, the gloss where it could not.
  const named = evidenceWords(evidence).here.map(
    (word) => here.get(word.index)?.text ?? localizedGloss(word, glosses).split(' / ')[0] ?? '',
  );
  // Every word, as the reader asked: the badge is where a link's shared vocabulary is read at a
  // glance, and a "+2" hides exactly what it is for.
  const shown = [...new Set(named)].join(', ');
  const label =
    evidence.kind === 'shared-word'
      ? t('evidence.sharedWord')(shown, named.length)
      : evidence.kind === 'same-meaning'
        ? t('evidence.sameMeaning')(shown)
        : t('evidence.thematic');

  const line = (word: OriginalWord, verse: VerseIndex) => (
    <WordUseLine
      word={word}
      verse={verse}
      link={link}
      translation={translation}
      occurrences={occurrences}
      versification={versification}
    />
  );
  const there = (word: OriginalWord) =>
    firstVerseWith(word, index, connection.otherStart, connection.otherEnd);

  return (
    <div className={styles.evidence}>
      <button
        type="button"
        className={`${styles.evidenceBadge} ${styles[`evidence-${evidence.kind}`] ?? ''}`}
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
        }}
      >
        {label}
        <ExpandIcon className={styles.chevron} />
      </button>
      {open && (
        <div className={styles.evidenceDetails}>
          {evidence.kind === 'shared-word' && (
            <>
              <p className={styles.muted}>{t('evidence.sharedWord.note')}</p>
              {evidence.words.map((word) => (
                <div key={word.strongs} className={styles.evidenceItem}>
                  <WordHeading word={word} glosses={glosses} />
                  {line(word, connection.here)}
                  {line(word, there(word))}
                </div>
              ))}
            </>
          )}
          {evidence.kind === 'same-meaning' && (
            <>
              <p className={styles.muted}>{t('evidence.sameMeaning.note')}</p>
              {evidence.pairs.map(({ here: ours, there: theirs }) => (
                <div key={`${ours.strongs}-${theirs.strongs}`} className={styles.evidenceItem}>
                  <WordHeading word={ours} glosses={glosses} />
                  {line(ours, connection.here)}
                  <WordHeading word={theirs} glosses={glosses} />
                  {line(theirs, there(theirs))}
                </div>
              ))}
            </>
          )}
          {evidence.kind === 'thematic' && (
            <p className={styles.muted}>{t('evidence.thematic.note')}</p>
          )}
        </div>
      )}
    </div>
  );
}
