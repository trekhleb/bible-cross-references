import { useCallback, useSyncExternalStore } from 'react';

/**
 * Small per-reader preferences, kept in localStorage so they last between visits.
 *
 * - The origin (trekhleb.dev) is shared with other sites, so every key is namespaced.
 * - Storage can be unavailable (private browsing, blocked site data): values then live in memory
 *   for the visit.
 * - Every component using a preference sees its changes at once, including other tabs.
 */

const PREFIX = 'bible-cross-references:';
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  const onStorage = () => {
    memory.clear(); // Another tab changed a preference: read it again.
    notify();
  };
  listeners.add(listener);
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function read(key: string): string | null {
  const stored = memory.get(PREFIX + key);
  if (stored !== undefined) {
    return stored;
  }
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  memory.set(PREFIX + key, value);
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch {
    // Unavailable: the value lasts for this visit only.
  }
  notify();
}

/** A yes/no preference, `fallback` until the reader changes it. */
export function useBooleanPreference(
  key: string,
  fallback: boolean,
): readonly [boolean, (value: boolean) => void] {
  const stored = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const set = useCallback(
    (value: boolean) => {
      write(key, String(value));
    },
    [key],
  );
  return [stored === null ? fallback : stored === 'true', set];
}
