/**
 * The offline cache. It makes repeat visits load from the device and lets the app work offline.
 *
 * The site lives under a path of a shared origin (trekhleb.dev/bible-cross-references/), so:
 * - the worker's scope is that path (browsers allow no wider scope for a worker served there), and
 *   it only ever handles requests under it;
 * - every cache it creates starts with `PREFIX`, and it only ever reads or deletes its own caches,
 *   never those of other sites on the origin.
 *
 * Strategies: the app's code and pages are cached per version and served from the cache
 * (pages network-first, so a new version shows up at once); the datasets are served from the cache
 * and refreshed in the background (stale-while-revalidate).
 */

declare const self: ServiceWorkerGlobalScope;

// Injected by the build (`offline()` in vite/offline.ts): paths relative to the worker's scope.
/** This version's pages and files. */
declare const PRECACHE: readonly string[];
/** The datasets, cached across versions. */
declare const DATASETS: readonly string[];
/** A hash of this version's files; a new version gets new caches. */
declare const VERSION: string;

const PREFIX = 'bible-cross-references';
const SHELL_CACHE = `${PREFIX}-shell-${VERSION}`;
const DATA_CACHE = `${PREFIX}-data`;

const scope = new URL(self.registration.scope);
// Cached files are the same whatever the request's headers (they are named by their content, or
// are datasets), so lookups ignore `Vary`: some hosts vary on `Origin`, which module scripts send
// and the worker's own requests don't.
const LOOKUP: CacheQueryOptions = { ignoreVary: true };
const toUrl = (path: string) => new URL(path, scope).href;
const datasetUrls = new Set(DATASETS.map(toUrl));

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL_CACHE);
      await shell.addAll(PRECACHE.map(toUrl));
      // The page has just downloaded the datasets, so these usually come from the HTTP cache.
      const data = await caches.open(DATA_CACHE);
      await Promise.all(
        [...datasetUrls].map(async (url) => {
          if (!(await data.match(url, LOOKUP))) {
            await data.add(url);
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const oldShells = (await caches.keys()).filter(
        (name) => name.startsWith(`${PREFIX}-shell-`) && name !== SHELL_CACHE,
      );
      await Promise.all(oldShells.map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    request.method !== 'GET' ||
    url.origin !== scope.origin ||
    !url.pathname.startsWith(scope.pathname)
  ) {
    return;
  }
  if (request.mode === 'navigate') {
    event.respondWith(page(request));
  } else if (datasetUrls.has(url.href)) {
    event.respondWith(dataset(event, request));
  } else {
    event.respondWith(file(request));
  }
});

/** Pages: the network first, so a new version shows at once; this version's copy offline. */
async function page(request: Request): Promise<Response> {
  try {
    return await fetch(request);
  } catch {
    const shell = await caches.open(SHELL_CACHE);
    // `?ref=…` only selects a passage: every passage of a page is the same file.
    const cached = await shell.match(request, { ...LOOKUP, ignoreSearch: true });
    return cached ?? Response.error();
  }
}

/** Datasets: the cached copy at once, refreshed in the background for the next visit. */
async function dataset(event: FetchEvent, request: Request): Promise<Response> {
  const cache = await caches.open(DATA_CACHE);
  const cached = await cache.match(request, LOOKUP);
  const refresh = fetch(request).then(async (response) => {
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  });
  if (cached) {
    event.waitUntil(refresh.catch(() => undefined));
    return cached;
  }
  return refresh;
}

/** The app's files: named by their content, so the cached copy is always right. */
async function file(request: Request): Promise<Response> {
  const shell = await caches.open(SHELL_CACHE);
  return (await shell.match(request, LOOKUP)) ?? fetch(request);
}
