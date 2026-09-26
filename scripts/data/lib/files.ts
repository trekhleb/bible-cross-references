import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { strFromU8, unzipSync } from 'fflate';

export function sha256Hex(content: Uint8Array): string {
  return createHash('sha256').update(content).digest('hex');
}

/** Reads a file, or returns `undefined` if it does not exist. */
export async function readFileIfExists(path: string): Promise<Buffer | undefined> {
  try {
    return await readFile(path);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

/** Writes a file atomically (via a temporary file), creating parent directories as needed. */
export async function writeFileAtomic(path: string, content: string | Uint8Array): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, content);
  await rename(temporaryPath, path);
}

/** Extracts a single UTF-8 text file from a ZIP archive. */
export function extractZipTextEntry(archive: Uint8Array, entryName: string): string {
  const entries = unzipSync(archive, { filter: (file) => file.name === entryName });
  const entry = entries[entryName];
  if (!entry) {
    throw new Error(`ZIP archive has no entry named "${entryName}".`);
  }
  return strFromU8(entry);
}

/** Removes a leading UTF-8 byte order mark, which some upstream text files include. */
export function stripByteOrderMark(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
