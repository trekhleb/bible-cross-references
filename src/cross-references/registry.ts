import type { CrossReferenceSourceId } from '../core/datasets/ids.ts';
import type { CrossReferenceSourceManifest } from './source-manifest.ts';

const CROSS_REFERENCE_SOURCES: Readonly<
  Record<CrossReferenceSourceId, CrossReferenceSourceManifest>
> = {
  openbible: {
    id: 'openbible',
    name: 'OpenBible.info Cross References',
    description:
      'About 345,000 cross-references, drawn mostly from the public-domain Treasury of ' +
      'Scripture Knowledge and ranked by community votes.',
    license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' },
    attribution:
      'Cross-reference data: OpenBible.info (CC BY 4.0), largely from the public-domain ' +
      'Treasury of Scripture Knowledge. Modified: re-indexed to KJV verse numbering.',
    homepage: 'https://www.openbible.info/labs/cross-references/',
    versification: 'kjv',
    enabledByDefault: true,
  },
};

export const CROSS_REFERENCE_SOURCE_MANIFESTS: readonly CrossReferenceSourceManifest[] =
  Object.values(CROSS_REFERENCE_SOURCES);
