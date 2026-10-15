/**
 * Builds the app's datasets from the raw source files: `data/raw/` → `public/data/`.
 *
 *   npm run data:build
 *   TRANSLATION=esv npm run data:build   with another translation (e.g. a local ESV text)
 *
 * Each dataset is produced by an importer that validates the raw data against the canonical
 * versification and fails loudly on anything unexpected.
 */
import { rm, stat } from 'node:fs/promises';
import { parseTranslationId } from '../../src/translations/registry.ts';
import {
  datasetBuilders,
  unusedDatasetPaths,
  type LocalFileReader,
  type RawSourceReader,
} from './datasets.ts';
import { formatBytes, readFileIfExists, sha256Hex, writeFileAtomic } from './lib/files.ts';
import { publicFilePath, rawFilePath } from './lib/paths.ts';
import { findSource, readSources } from './lib/sources.ts';

const translationId = parseTranslationId(process.env['TRANSLATION']);
const sources = await readSources();

const readSource: RawSourceReader = async (sourceId) => {
  const source = findSource(sources, sourceId);
  const content = await readFileIfExists(rawFilePath(source.fileName));
  if (!content) {
    throw new Error(`Raw file for "${sourceId}" is missing. Run \`npm run data:fetch\` first.`);
  }
  if (sha256Hex(content) !== source.sha256) {
    throw new Error(
      `Raw file for "${sourceId}" does not match its pinned checksum. Run \`npm run data:fetch\`.`,
    );
  }
  return { source, content };
};

const readLocalFile: LocalFileReader = async (fileName) => {
  const path = rawFilePath(fileName);
  const content = await readFileIfExists(path);
  if (!content) {
    throw new Error(
      `data/raw/${fileName} is missing. This text is not committed: put your own copy there ` +
        '(see data/raw/README.md).',
    );
  }
  const { mtime } = await stat(path);
  return {
    content,
    provenance: {
      url: `file:data/raw/${fileName}`,
      sha256: sha256Hex(content),
      retrievedAt: mtime.toISOString().slice(0, 10),
      snapshotDate: null,
    },
  };
};

for (const builder of datasetBuilders(translationId)) {
  const dataset = await builder.build(readSource, readLocalFile);
  const json = JSON.stringify(dataset);
  await writeFileAtomic(publicFilePath(builder.outputPath), json);
  console.log(`✓ public/${builder.outputPath} (${formatBytes(Buffer.byteLength(json))})`);
  for (const notice of dataset.notices) {
    console.log(`  ${notice.level}: ${notice.message} [${notice.count}]`);
  }
}
for (const path of unusedDatasetPaths(translationId)) {
  await rm(publicFilePath(path), { force: true });
}
