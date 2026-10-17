import { t } from '../../../locales/ui.ts';
import type { TranslationManifest } from '../../../translations/translation-manifest.ts';
import styles from './Credits.module.css';

interface CreditsProps {
  /** The translation on screen, credited by its own manifest. */
  readonly translation: TranslationManifest;
  /** The work that inspired the visualization, credited by name with a link. */
  readonly inspiration?: { readonly title: string; readonly author: string; readonly url: string };
}

/**
 * Data attribution plus the visualization's inspiration.
 *
 * The links are CC BY 4.0, which asks for the creator, a link to the licence and an indication
 * that the material was changed. The creator and the licence are named at every width; the note
 * that the links were re-indexed joins them from 48rem up, and the full statement, with what the
 * change was, is in the README that the footer's source mark links to. A phone footer has room
 * for the attribution or for the background, not for both.
 *
 * The text's own credit comes from its manifest, so it follows whichever translation is read. On
 * a phone it goes with the background: it is a courtesy rather than a condition (every text here
 * is public domain), and the header's picker names the text being read at every width.
 */
export function Credits({ translation, inspiration }: CreditsProps) {
  return (
    <>
      <span className={styles.detail}>{t('Links:')} </span>
      <a href="https://www.openbible.info/labs/cross-references/" target="_blank" rel="noreferrer">
        OpenBible.info
      </a>{' '}
      (
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">
        CC BY 4.0
      </a>
      <span className={styles.wide}>{t(', from the Treasury of Scripture Knowledge')}</span>
      <span className={styles.detail}>
        , re-indexed<span className={styles.wide}> to KJV verse numbering</span>
      </span>
      )
      <span className={styles.text}>
        {' '}
        {t('· Text:')}{' '}
        <a href={translation.homepage} target="_blank" rel="noreferrer">
          {translation.abbreviation}
        </a>
        <span className={styles.detail}> ({t(translation.license.name)})</span>
      </span>
      {inspiration && (
        <span className={styles.wide}>
          {' '}
          {t('· Inspired by')}{' '}
          {/* The work's own name is this app's name too, so saying it here reads as a stutter and
              costs the line the room it needs; the link, and its tooltip, still carry it. */}
          <a
            href={inspiration.url}
            target="_blank"
            rel="noreferrer"
            title={`${inspiration.title}, by ${inspiration.author}`}
          >
            {inspiration.author}
          </a>
        </span>
      )}
    </>
  );
}
