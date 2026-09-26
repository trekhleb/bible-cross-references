import { useMemo } from 'react';
import type { Testament } from '../../../core/bible/books.ts';
import { CANONICAL_VERSIFICATION } from '../../../core/bible/versification.ts';
import type { CrossReferenceDataset } from '../../../cross-references/load-cross-references.ts';
import { formatDecimal, formatInteger, formatShare } from '../../../shared/lib/format.ts';
import { Bar } from '../../../shared/ui/Bar.tsx';
import { DataTable } from '../../../shared/ui/DataTable.tsx';
import { KeyValueList } from '../../../shared/ui/KeyValueList.tsx';
import { Section } from '../../../shared/ui/Section.tsx';
import styles from '../DebugPage.module.css';
import { computeCrossReferenceStats, type VerseCount } from '../stats/cross-reference-stats.ts';
import { NoticeList } from './NoticeList.tsx';
import { SourceDetails } from './SourceDetails.tsx';
import { VerseLink } from './VerseLink.tsx';

interface CrossReferencesSectionProps {
  readonly id: string;
  readonly dataset: CrossReferenceDataset;
}

const TESTAMENTS: readonly Testament[] = ['OT', 'NT'];

function withShare(part: number, whole: number): string {
  return `${formatInteger(part)} (${formatShare(part, whole)})`;
}

function VerseCountTable({
  caption,
  rows,
}: {
  readonly caption: string;
  readonly rows: readonly VerseCount[];
}) {
  return (
    <DataTable
      caption={caption}
      rows={rows}
      rowKey={(row) => row.verse}
      columns={[
        { header: 'Verse', render: (row) => <VerseLink verse={row.verse} /> },
        { header: 'Links', align: 'end', render: (row) => formatInteger(row.count) },
      ]}
    />
  );
}

export function CrossReferencesSection({ id, dataset }: CrossReferencesSectionProps) {
  const { manifest, index } = dataset;
  const stats = useMemo(() => computeCrossReferenceStats(index, CANONICAL_VERSIFICATION), [index]);
  const verseCount = index.verseCount;
  const maxBucketCount = Math.max(...stats.votes.histogram.map((bucket) => bucket.count));
  const longestRange =
    stats.longestRangeLinkId === undefined ? undefined : index.link(stats.longestRangeLinkId);

  return (
    <Section
      id={id}
      title={`Cross-references · ${manifest.name}`}
      description={manifest.description}
    >
      <SourceDetails
        items={[{ label: 'ID', value: <code>{manifest.id}</code> }]}
        license={manifest.license}
        attribution={manifest.attribution}
        homepage={manifest.homepage}
        provenance={dataset.provenance}
      />

      <div>
        <h3 className={styles.subheading}>Links</h3>
        <KeyValueList
          items={[
            { label: 'Raw rows', value: formatInteger(dataset.sourceRowCount) },
            { label: 'Links', value: formatInteger(stats.linkCount) },
            { label: 'Distinct verse pairs', value: formatInteger(stats.distinctPairCount) },
            {
              label: 'Reciprocal pairs',
              value: `${formatInteger(stats.reciprocalPairCount)} (A → B and B → A)`,
            },
            {
              label: 'Verses with outgoing links',
              value: withShare(stats.sourceVerseCount, verseCount),
            },
            {
              label: 'Verses with incoming links',
              value: withShare(stats.targetVerseCount, verseCount),
            },
            {
              label: 'Verses without any link',
              value: withShare(stats.unconnectedVerses.length, verseCount),
            },
            {
              label: 'Links per verse (avg.)',
              value: formatDecimal(stats.linkCount / Math.max(stats.sourceVerseCount, 1)),
            },
            { label: 'Links to a range', value: withShare(stats.rangeLinkCount, stats.linkCount) },
            { label: '… spanning chapters', value: formatInteger(stats.crossChapterRangeCount) },
            { label: '… spanning books', value: formatInteger(stats.crossBookRangeCount) },
            {
              label: '… containing their source',
              value: formatInteger(stats.selfInclusiveLinkCount),
            },
            {
              label: 'Longest range',
              value: longestRange ? (
                <>
                  <VerseLink verse={longestRange.targetStart} rangeEnd={longestRange.targetEnd} />{' '}
                  (from <VerseLink verse={longestRange.from} />,{' '}
                  {formatInteger(longestRange.targetEnd - longestRange.targetStart + 1)} verses)
                </>
              ) : (
                '—'
              ),
            },
          ]}
        />
      </div>

      <div className={styles.columns}>
        <div>
          <h3 className={styles.subheading}>Votes</h3>
          <KeyValueList
            items={[
              {
                label: 'Min / max',
                value: `${formatInteger(stats.votes.min)} / ${formatInteger(stats.votes.max)}`,
              },
              { label: 'Mean', value: formatDecimal(stats.votes.mean) },
              { label: 'Median', value: formatDecimal(stats.votes.median) },
            ]}
          />
        </div>
        <DataTable
          caption="Vote distribution"
          rows={stats.votes.histogram}
          rowKey={(bucket) => bucket.label}
          columns={[
            { header: 'Votes', render: (bucket) => bucket.label },
            { header: 'Links', align: 'end', render: (bucket) => formatInteger(bucket.count) },
            {
              header: 'Share',
              align: 'end',
              render: (bucket) => formatShare(bucket.count, stats.linkCount),
            },
            {
              header: '',
              render: (bucket) => (
                <Bar value={bucket.count} max={maxBucketCount} label={`${bucket.count} links`} />
              ),
            },
          ]}
        />
        <DataTable
          caption="Links kept by a minimum-votes threshold"
          rows={stats.votes.thresholds}
          rowKey={(threshold) => threshold.minVotes}
          columns={[
            { header: 'Min. votes', render: (threshold) => `≥ ${threshold.minVotes}` },
            {
              header: 'Links',
              align: 'end',
              render: (threshold) => formatInteger(threshold.count),
            },
            {
              header: 'Share',
              align: 'end',
              render: (threshold) => formatShare(threshold.count, stats.linkCount),
            },
          ]}
        />
      </div>

      <div className={styles.narrow}>
        <DataTable
          caption="Links by testament (source → target)"
          rows={TESTAMENTS}
          rowKey={(testament) => testament}
          columns={[
            { header: 'From \\ to', render: (from) => from },
            ...TESTAMENTS.map((to) => ({
              header: to,
              align: 'end' as const,
              render: (from: Testament) =>
                withShare(stats.testamentFlow[from][to], stats.linkCount),
            })),
          ]}
        />
      </div>

      <div className={styles.columns}>
        <VerseCountTable caption="Most outgoing links" rows={stats.topSources} />
        <VerseCountTable caption="Most incoming links" rows={stats.topTargets} />
        <DataTable
          caption="Most voted links"
          rows={stats.topVotedLinkIds.map((id) => index.link(id))}
          rowKey={(link) => link.id}
          columns={[
            { header: 'From', render: (link) => <VerseLink verse={link.from} /> },
            {
              header: 'To',
              render: (link) => <VerseLink verse={link.targetStart} rangeEnd={link.targetEnd} />,
            },
            { header: 'Votes', align: 'end', render: (link) => formatInteger(link.votes) },
          ]}
        />
      </div>

      <details>
        <summary className={styles.summary}>Links by book</summary>
        <DataTable
          rows={stats.books}
          rowKey={(row) => row.book.id}
          columns={[
            { header: 'Book', render: (row) => row.book.name },
            { header: 'Verses', align: 'end', render: (row) => formatInteger(row.verseCount) },
            { header: 'Outgoing', align: 'end', render: (row) => formatInteger(row.outgoing) },
            { header: 'Incoming', align: 'end', render: (row) => formatInteger(row.incoming) },
            {
              header: 'Outgoing per verse',
              align: 'end',
              render: (row) => formatDecimal(row.outgoing / row.verseCount),
            },
          ]}
        />
      </details>

      <details>
        <summary className={styles.summary}>
          Verses without any link ({formatInteger(stats.unconnectedVerses.length)})
        </summary>
        <p className={styles.inlineList}>
          {stats.unconnectedVerses.map((verse) => (
            <VerseLink key={verse} verse={verse} />
          ))}
        </p>
      </details>

      <div>
        <h3 className={styles.subheading}>Import notices</h3>
        <NoticeList notices={dataset.notices} />
      </div>
    </Section>
  );
}
