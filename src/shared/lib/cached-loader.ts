export interface CachedLoader<T> {
  /** Returns the same promise until `reset` is called, as required by React's `use()`. */
  readonly load: () => Promise<T>;
  /** Forgets the cached promise, e.g. to retry after a failure. */
  readonly reset: () => void;
}

export function createCachedLoader<T>(loader: () => Promise<T>): CachedLoader<T> {
  let promise: Promise<T> | undefined;
  return {
    load: () => (promise ??= loader()),
    reset: () => {
      promise = undefined;
    },
  };
}
