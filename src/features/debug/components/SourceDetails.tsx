import type { DatasetProvenance } from '../../../core/datasets/formats.ts';
import type { LicenseInfo } from '../../../core/datasets/metadata.ts';
import { KeyValueList, type KeyValueItem } from '../../../shared/ui/KeyValueList.tsx';

interface SourceDetailsProps {
  readonly items: readonly KeyValueItem[];
  readonly license: LicenseInfo;
  readonly attribution: string;
  readonly homepage: string;
  readonly provenance: DatasetProvenance;
}

function ExternalLink({ href, children }: { readonly href: string; readonly children: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
    </a>
  );
}

/** Identity, license and provenance of a dataset, so every figure can be traced to its source. */
export function SourceDetails({
  items,
  license,
  attribution,
  homepage,
  provenance,
}: SourceDetailsProps) {
  return (
    <KeyValueList
      items={[
        ...items,
        { label: 'License', value: <ExternalLink href={license.url}>{license.name}</ExternalLink> },
        { label: 'Attribution', value: attribution },
        { label: 'Homepage', value: <ExternalLink href={homepage}>{homepage}</ExternalLink> },
        {
          label: 'Raw file',
          value: <ExternalLink href={provenance.url}>{provenance.url}</ExternalLink>,
        },
        { label: 'SHA-256', value: <code>{provenance.sha256}</code> },
        { label: 'Retrieved', value: provenance.retrievedAt },
        { label: 'Upstream snapshot', value: provenance.snapshotDate ?? 'not published' },
      ]}
    />
  );
}
