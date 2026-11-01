import type { VerseIndex } from '../core/bible/verse-ref.ts';
import type { Translation } from './translation.ts';

/** A verse's text, or a note in its place where the translation leaves the verse out. */
export function verseTextOrNote(
  translation: Translation,
  verse: VerseIndex,
  omittedNote?: string,
): string {
  return (
    translation.verseText(verse) ||
    (translation.manifest.emptyVerseNote ?? omittedNote ?? translation.textOrNote(verse))
  );
}
