/**
 * Registers the offline cache (sw/service-worker.ts), in production builds only. Its scope is the
 * site's base path, the widest a worker served from there may have, so it never touches the other
 * sites of the origin.
 */
export function registerOfflineCache(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }
  navigator.serviceWorker
    .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
    .catch((error: unknown) => {
      console.warn('The offline cache is unavailable:', error);
    });
}
