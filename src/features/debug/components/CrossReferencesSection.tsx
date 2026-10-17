import { t } from '../../../locales/ui.ts';
import { getDisplayBookName } from '../../../core/bible/book-labels.ts';
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
        { header: t('Verse'), render: (row) => <VerseLink verse={row.verse} /> },
        { header: t('Links'), align: 'end', render: (row) => formatInteger(row.count) },
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
      title={t('Cross-references · {name}', { name: manifest.name })}
      description={manifest.description}
    >
      <SourceDetails
        items={[{ label: t('ID'), value: <code>{manifest.id}</code> }]}
        license={manifest.license}
        attribution={manifest.attribution}
        homepage={manifest.homepage}
        provenance={dataset.provenance}
      />

      <div>
        <h3 className={styles.subheading}>{t('Links')}</h3>
        <KeyValueList
          items={[
            { label: t('Raw rows'), value: formatInteger(dataset.sourceRowCount) },
            { label: t('Links'), value: formatInteger(stats.linkCount) },
            { label: t('Distinct verse pairs'), value: formatInteger(stats.distinctPairCount) },
            {
              label: t('Reciprocal pairs'),
              value: `${formatInteger(stats.reciprocalPairCount)} (A → B and B → A)`,
            },
            {
              label: t('Verses with outgoing links'),
              value: withShare(stats.sourceVerseCount, verseCount),
            },
            {
              label: t('Verses with incoming links'),
              value: withShare(stats.targetVerseCount, verseCount),
            },
            {
              label: t('Verses without any link'),
              value: withShare(stats.unconnectedVerses.length, verseCount),
            },
            {
              label: t('Links per verse (avg.)'),
              value: formatDecimal(stats.linkCount / Math.max(stats.sourceVerseCount, 1)),
            },
            {
              label: t('Links to a range'),
              value: withShare(stats.rangeLinkCount, stats.linkCount),
            },
            { label: t('… spanning chapters'), value: formatInteger(stats.crossChapterRangeCount) },
            { label: t('… spanning books'), value: formatInteger(stats.crossBookRangeCount) },
            {
              label: t('… containing their source'),
              value: formatInteger(stats.selfInclusiveLinkCount),
            },
            {
              label: t('Longest range'),
              value: longestRange ? (
                <>
                  <VerseLink verse={longestRange.targetStart} rangeEnd={longestRange.targetEnd} />{' '}
                  {t('(from')} <VerseLink verse={longestRange.from} />,{' '}
                  {formatInteger(longestRange.targetEnd - longestRange.targetStart + 1)}{' '}
                  {t('verses)')}
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
          <h3 className={styles.subheading}>{t('Votes')}</h3>
          <KeyValueList
            items={[
              {
                label: t('Min / max'),
                value: `${formatInteger(stats.votes.min)} / ${formatInteger(stats.votes.max)}`,
              },
              { label: t('Mean'), value: formatDecimal(stats.votes.mean) },
              { label: t('Median'), value: formatDecimal(stats.votes.median) },
            ]}
          />
        </div>
        <DataTable
          caption={t('Vote distribution')}
          rows={stats.votes.histogram}
          rowKey={(bucket) => bucket.label}
          columns={[
            { header: t('Votes'), render: (bucket) => bucket.label },
            { header: t('Links'), align: 'end', render: (bucket) => formatInteger(bucket.count) },
            {
              header: t('Share'),
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
          caption={t('Links kept by a minimum-votes threshold')}
          rows={stats.votes.thresholds}
          rowKey={(threshold) => threshold.minVotes}
          columns={[
            { header: t('Min. votes'), render: (threshold) => `≥ ${threshold.minVotes}` },
            {
              header: t('Links'),
              align: 'end',
              render: (threshold) => formatInteger(threshold.count),
            },
            {
              header: t('Share'),
              align: 'end',
              render: (threshold) => formatShare(threshold.count, stats.linkCount),
            },
          ]}
        />
      </div>

      <div className={styles.narrow}>
        <DataTable
          caption={t('Links by testament (source → target)')}
          rows={TESTAMENTS}
          rowKey={(testament) => testament}
          columns={[
            { header: t('From \\ to'), render: (from) => from },
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
        <VerseCountTable caption={t('Most outgoing links')} rows={stats.topSources} />
        <VerseCountTable caption={t('Most incoming links')} rows={stats.topTargets} />
        <DataTable
          caption={t('Most voted links')}
          rows={stats.topVotedLinkIds.map((id) => index.link(id))}
          rowKey={(link) => link.id}
          columns={[
            { header: t('From'), render: (link) => <VerseLink verse={link.from} /> },
            {
              header: t('To'),
              render: (link) => <VerseLink verse={link.targetStart} rangeEnd={link.targetEnd} />,
            },
            { header: t('Votes'), align: 'end', render: (link) => formatInteger(link.votes) },
          ]}
        />
      </div>

      <details>
        <summary className={styles.summary}>{t('Links by book')}</summary>
        <DataTable
          rows={stats.books}
          rowKey={(row) => row.book.id}
          columns={[
            { header: t('Book'), render: (row) => getDisplayBookName(row.book) },
            { header: t('Verses'), align: 'end', render: (row) => formatInteger(row.verseCount) },
            { header: t('Outgoing'), align: 'end', render: (row) => formatInteger(row.outgoing) },
            { header: t('Incoming'), align: 'end', render: (row) => formatInteger(row.incoming) },
            {
              header: t('Outgoing per verse'),
              align: 'end',
              render: (row) => formatDecimal(row.outgoing / row.verseCount),
            },
          ]}
        />
      </details>

      <details>
        <summary className={styles.summary}>
          {t('Verses without any link (')}
          {formatInteger(stats.unconnectedVerses.length)})
        </summary>
        <p className={styles.inlineList}>
          {stats.unconnectedVerses.map((verse) => (
            <VerseLink key={verse} verse={verse} />
          ))}
        </p>
      </details>

      <div>
        <h3 className={styles.subheading}>{t('Import notices')}</h3>
        <NoticeList notices={dataset.notices} />
      </div>
    </Section>
  );
}
