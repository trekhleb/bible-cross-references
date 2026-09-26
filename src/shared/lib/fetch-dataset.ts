/** Timing and size of a loaded dataset file, shown on the debug page. */
export interface DatasetLoadReport {
  readonly path: string;
  readonly url: string;
  /** Uncompressed size of the file. */
  readonly bytes: number;
  readonly downloadMs: number;
  readonly parseMs: number;
  /** Time spent validating the file and building in-memory indices. */
  readonly processMs: number;
}

export class DatasetUnavailableError extends Error {
  readonly path: string;

  constructor(path: string, reason: string) {
    super(
      `Dataset "${path}" is unavailable (${reason}). ` +
        'Generate the datasets with `npm run data` (see README.md).',
    );
    this.name = 'DatasetUnavailableError';
    this.path = path;
  }
}

export interface FetchedDataset {
  readonly json: unknown;
  readonly report: Omit<DatasetLoadReport, 'processMs'>;
}

/** Fetches a generated dataset file (a path relative to the site root) and parses its JSON. */
export async function fetchDataset(path: string): Promise<FetchedDataset> {
  const url = `${import.meta.env.BASE_URL}${path}`;
  const downloadStart = performance.now();
  let response: Response;
  try {
    // A plain GET, so the browser reuses the download the HTML preloaded.
    response = await fetch(url);
  } catch (error) {
    throw new DatasetUnavailableError(
      path,
      error instanceof Error ? error.message : 'network error',
    );
  }
  if (!response.ok) {
    throw new DatasetUnavailableError(path, `HTTP ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const text = new TextDecoder().decode(buffer);
  const downloadMs = performance.now() - downloadStart;

  const parseStart = performance.now();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new DatasetUnavailableError(path, 'the response is not valid JSON');
  }
  const parseMs = performance.now() - parseStart;

  return { json, report: { path, url, bytes: buffer.byteLength, downloadMs, parseMs } };
}

/** Measures how long a synchronous step takes. */
export function measure<T>(step: () => T): { readonly value: T; readonly ms: number } {
  const start = performance.now();
  const value = step();
  return { value, ms: performance.now() - start };
}
