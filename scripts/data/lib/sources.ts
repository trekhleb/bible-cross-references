import { readFile } from 'node:fs/promises';
import {
  expectArrayOf,
  expectRecord,
  expectString,
  ValidationError,
} from '../../../src/core/lib/validation.ts';
import { writeFileAtomic } from './files.ts';
import { SOURCES_FILE } from './paths.ts';

/** An upstream file the data pipeline depends on, pinned by its SHA-256 checksum. */
export interface RawSource {
  readonly id: string;
  readonly description: string;
  readonly url: string;
  /** File name under `data/raw/`. */
  readonly fileName: string;
  /** Expected SHA-256 (hex) of the downloaded file. */
  readonly sha256: string;
  /** Date (YYYY-MM-DD) on which the pinned file was retrieved. */
  readonly retrievedAt: string;
  readonly license: string;
  readonly homepage: string;
}

const SHA256_PATTERN = /^[0-9a-f]{64}$/;
const FILE_NAME_PATTERN = /^[\w.-]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function expectMatch(value: unknown, pattern: RegExp, path: string): string {
  const text = expectString(value, path);
  if (!pattern.test(text)) {
    throw new ValidationError(path, `"${text}" does not match ${String(pattern)}`);
  }
  return text;
}

function parseRawSource(value: unknown, path: string): RawSource {
  const record = expectRecord(value, path);
  return {
    id: expectString(record['id'], `${path}.id`),
    description: expectString(record['description'], `${path}.description`),
    url: expectString(record['url'], `${path}.url`),
    fileName: expectMatch(record['fileName'], FILE_NAME_PATTERN, `${path}.fileName`),
    sha256: expectMatch(record['sha256'], SHA256_PATTERN, `${path}.sha256`),
    retrievedAt: expectMatch(record['retrievedAt'], DATE_PATTERN, `${path}.retrievedAt`),
    license: expectString(record['license'], `${path}.license`),
    homepage: expectString(record['homepage'], `${path}.homepage`),
  };
}

export async function readSources(): Promise<RawSource[]> {
  const json: unknown = JSON.parse(await readFile(SOURCES_FILE, 'utf8'));
  const sources = expectArrayOf(
    expectRecord(json, 'sources.json')['sources'],
    'sources',
    parseRawSource,
  );
  const ids = new Set(sources.map((source) => source.id));
  if (ids.size !== sources.length) {
    throw new Error(`${SOURCES_FILE}: source IDs must be unique.`);
  }
  return sources;
}

export async function writeSources(sources: readonly RawSource[]): Promise<void> {
  await writeFileAtomic(SOURCES_FILE, `${JSON.stringify({ sources }, null, 2)}\n`);
}

export function findSource(sources: readonly RawSource[], id: string): RawSource {
  const source = sources.find((candidate) => candidate.id === id);
  if (!source) {
    throw new Error(`${SOURCES_FILE} has no source with ID "${id}".`);
  }
  return source;
}
