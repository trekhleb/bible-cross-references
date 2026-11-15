import { isTranslationId, type TranslationId } from '../core/datasets/ids.ts';
import { DEFAULT_TRANSLATION_ID, getTranslationManifest } from './registry.ts';

/** Read the upstream translation query parameter. */
export function translationIdFromParams(params: URLSearchParams): TranslationId | null {
  const id = params.get('t');
  return id !== null && isTranslationId(id) ? id : null;
}

/** Shared by book labels, interface text and the debug page; safe during Node data builds. */
export function selectedTranslation(
  search = (globalThis as { location?: { search: string } }).location?.search ?? '',
) {
  let preferred: TranslationId = DEFAULT_TRANSLATION_ID;
  try {
    const stored = (
      globalThis as { localStorage?: { getItem(key: string): string | null } }
    ).localStorage?.getItem('bible-cross-references:translation');
    if (stored && isTranslationId(stored)) preferred = stored;
  } catch {
    // Storage may be blocked; explicit URL choices still work.
  }
  return getTranslationManifest(translationIdFromParams(new URLSearchParams(search)) ?? preferred);
}
