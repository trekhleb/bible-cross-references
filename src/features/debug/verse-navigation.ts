import { createContext, useContext } from 'react';
import type { VerseIndex } from '../../core/bible/verse-ref.ts';

/** Lets any verse link on the debug page open that verse in the inspector. */
export const VerseNavigationContext = createContext<((verse: VerseIndex) => void) | null>(null);

export function useSelectVerse(): (verse: VerseIndex) => void {
  const selectVerse = useContext(VerseNavigationContext);
  if (!selectVerse) {
    throw new Error('useSelectVerse must be used inside VerseNavigationContext.');
  }
  return selectVerse;
}
