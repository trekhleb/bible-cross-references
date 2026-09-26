import { formatVerseIndexRange } from '../../../core/bible/reference-format.ts';
import type { VerseIndex } from '../../../core/bible/verse-ref.ts';
import { CANONICAL_VERSIFICATION } from '../../../core/bible/versification.ts';
import { useSelectVerse } from '../verse-navigation.ts';
import styles from '../DebugPage.module.css';

interface VerseLinkProps {
  readonly verse: VerseIndex;
  /** Last verse of a range, if the link points to a range; the range's first verse is opened. */
  readonly rangeEnd?: VerseIndex;
}

/** A verse reference that opens the verse in the inspector. */
export function VerseLink({ verse, rangeEnd = verse }: VerseLinkProps) {
  const selectVerse = useSelectVerse();
  return (
    <button
      type="button"
      className={styles.linkButton}
      onClick={() => {
        selectVerse(verse);
      }}
    >
      {formatVerseIndexRange(CANONICAL_VERSIFICATION, verse, rangeEnd)}
    </button>
  );
}
