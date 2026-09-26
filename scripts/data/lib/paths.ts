import { resolve } from 'node:path';

export const REPO_ROOT = resolve(import.meta.dirname, '../../..');

/** Pinned upstream sources (committed). */
export const SOURCES_FILE = resolve(REPO_ROOT, 'data/sources.json');

/** Downloaded raw source files (git-ignored). */
export const RAW_DATA_DIR = resolve(REPO_ROOT, 'data/raw');

/** Static assets served by the app; generated datasets go under `public/data` (git-ignored). */
export const PUBLIC_DIR = resolve(REPO_ROOT, 'public');

export function rawFilePath(fileName: string): string {
  return resolve(RAW_DATA_DIR, fileName);
}

export function publicFilePath(sitePath: string): string {
  return resolve(PUBLIC_DIR, sitePath);
}
