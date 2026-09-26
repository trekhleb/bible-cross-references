import { parseOsisId, toOsisId, type VerseIndex } from '../../core/bible/verse-ref.ts';
import { CANONICAL_VERSIFICATION } from '../../core/bible/versification.ts';

/** URL query parameter holding the inspected verse as an OSIS ID, e.g. `?verse=John.3.16`. */
const VERSE_PARAM = 'verse';

export function readVerseFromUrl(): VerseIndex | undefined {
  const osisId = new URLSearchParams(window.location.search).get(VERSE_PARAM);
  const ref = osisId === null ? undefined : parseOsisId(osisId);
  return ref && CANONICAL_VERSIFICATION.indexOf(ref);
}

export function writeVerseToUrl(verse: VerseIndex): void {
  const url = new URL(window.location.href);
  url.searchParams.set(VERSE_PARAM, toOsisId(CANONICAL_VERSIFICATION.refAt(verse)));
  window.history.replaceState(null, '', url);
}
