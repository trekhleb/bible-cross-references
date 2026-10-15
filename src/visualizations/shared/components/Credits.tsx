import { vizDatasets } from '../viz-datasets.ts';
import styles from './Credits.module.css';

interface CreditsProps {
  /** The work that inspired the visualization, credited by name with a link. */
  readonly inspiration?: { readonly title: string; readonly author: string; readonly url: string };
}

/**
 * Data attribution (required by CC BY 4.0) plus the visualization's inspiration. Phones show the
 * essential attribution only; the details appear on wider screens.
 */
export function Credits({ inspiration }: CreditsProps) {
  const { translation } = vizDatasets(import.meta.env.TRANSLATION);
  return (
    <>
      <span className={styles.detail}>Links: </span>
      <a href="https://www.openbible.info/labs/cross-references/" target="_blank" rel="noreferrer">
        OpenBible.info
      </a>{' '}
      (CC BY 4.0
      <span className={styles.detail}>, from the Treasury of Scripture Knowledge</span>) · Text:{' '}
      {translation.abbreviation}
      <span className={styles.detail}> ({translation.license.name})</span>
      {inspiration && (
        <span className={styles.detail}>
          {' '}
          · Inspired by{' '}
          <a href={inspiration.url} target="_blank" rel="noreferrer">
            {inspiration.title}
          </a>{' '}
          by {inspiration.author}
        </span>
      )}
    </>
  );
}
