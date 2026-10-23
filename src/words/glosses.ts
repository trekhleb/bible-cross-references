import { useEffect, useState } from 'react';
import type { LocaleId } from '../i18n/locale-id.ts';

/** A language's glosses, keyed by extended Strong's number. */
export type GlossTable = Readonly<Record<string, string>>;

/**
 * The languages that have glosses of their own, each a separate chunk: a reader of any other
 * language never downloads them, and a Polish reader downloads them once, beside the words.
 */
const GLOSS_LOADERS: Partial<Record<LocaleId, () => Promise<GlossTable>>> = {
  pl: async () => (await import('./glosses/pl.json')).default,
};

const loaded = new Map<LocaleId, GlossTable>();

/** Whether a language shows glosses of its own rather than the English ones. */
export function hasOwnGlosses(localeId: LocaleId): boolean {
  return GLOSS_LOADERS[localeId] !== undefined;
}

export async function loadGlosses(localeId: LocaleId): Promise<GlossTable | null> {
  const load = GLOSS_LOADERS[localeId];
  if (!load) {
    return null;
  }
  const cached = loaded.get(localeId);
  if (cached) {
    return cached;
  }
  const table = await load();
  loaded.set(localeId, table);
  return table;
}

/**
 * The glosses for the reader's language, or `null` while they load and for a language that has
 * none — both of which show the English gloss, so the panel never waits on them.
 */
export function useGlosses(localeId: LocaleId): GlossTable | null {
  // Kept with the language it belongs to, so a switch of language shows the English glosses until
  // the new table arrives rather than the previous language's.
  const [arrived, setArrived] = useState<{ localeId: LocaleId; table: GlossTable } | null>(null);
  useEffect(() => {
    let current = true;
    loadGlosses(localeId).then(
      (table) => {
        if (current && table) {
          setArrived({ localeId, table });
        }
      },
      () => {
        // A chunk that failed to download leaves the English glosses in place; the next verse
        // opened asks again.
      },
    );
    return () => {
      current = false;
    };
  }, [localeId]);
  if (arrived?.localeId === localeId) {
    return arrived.table;
  }
  return loaded.get(localeId) ?? null;
}

/** A word's gloss in the reader's language, or the English one where there is none. */
export function localizedGloss(
  word: { readonly strongs: string; readonly gloss: string },
  table: GlossTable | null,
): string {
  return table?.[word.strongs] ?? word.gloss;
}
