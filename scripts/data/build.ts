/**
 * Builds the app's datasets from the raw source files: `data/raw/` → `public/data/`.
 *
 *   npm run data:build
 *
 * Each dataset is produced by an importer that validates the raw data against the canonical
 * versification and fails loudly on anything unexpected.
 */
import { DATASET_BUILDERS, type RawSourceReader } from './datasets.ts';
import { formatBytes, readFileIfExists, sha256Hex, writeFileAtomic } from './lib/files.ts';
import { publicFilePath, rawFilePath } from './lib/paths.ts';
import { findSource, readSources } from './lib/sources.ts';

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

for (const builder of DATASET_BUILDERS) {
  const dataset = await builder.build(readSource);
  const json = JSON.stringify(dataset);
  await writeFileAtomic(publicFilePath(builder.outputPath), json);
  console.log(`✓ public/${builder.outputPath} (${formatBytes(Buffer.byteLength(json))})`);
  for (const notice of dataset.notices) {
    console.log(`  ${notice.level}: ${notice.message} [${notice.count}]`);
  }
}
