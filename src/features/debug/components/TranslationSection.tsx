import { useMemo } from 'react';
import { formatDecimal, formatInteger, formatShare } from '../../../shared/lib/format.ts';
import { KeyValueList } from '../../../shared/ui/KeyValueList.tsx';
import { Section } from '../../../shared/ui/Section.tsx';
import type { Translation } from '../../../translations/translation.ts';
import styles from '../DebugPage.module.css';
import { computeTranslationStats, type VerseMeasure } from '../stats/translation-stats.ts';
import { NoticeList } from './NoticeList.tsx';
import { SourceDetails } from './SourceDetails.tsx';
import { VerseLink } from './VerseLink.tsx';

interface TranslationSectionProps {
  readonly id: string;
  readonly translation: Translation;
}

function VerseMeasureValue({ measure }: { readonly measure: VerseMeasure | undefined }) {
  return measure ? (
    <>
      <VerseLink verse={measure.verse} /> ({formatInteger(measure.value)} words)
    </>
  ) : (
    '—'
  );
}

export function TranslationSection({ id, translation }: TranslationSectionProps) {
  const stats = useMemo(() => computeTranslationStats(translation), [translation]);
  const { manifest } = translation;

  return (
    <Section
      id={id}
      title={`Translation · ${manifest.name}`}
      description="The Bible text displayed by the app. Translations are plugins registered in src/translations/registry.ts."
    >
      <SourceDetails
        items={[
          { label: 'ID', value: <code>{manifest.id}</code> },
          { label: 'Abbreviation', value: manifest.abbreviation },
          { label: 'Language', value: `${manifest.language} (${manifest.direction})` },
          { label: 'Versification', value: manifest.versification.toUpperCase() },
          { label: 'Access', value: manifest.access },
        ]}
        license={manifest.license}
        attribution={manifest.attribution}
        homepage={manifest.homepage}
        provenance={translation.provenance}
      />

      <div>
        <h3 className={styles.subheading}>Text statistics</h3>
        <KeyValueList
          items={[
            { label: 'Books', value: formatInteger(stats.bookCount) },
            { label: 'Chapters', value: formatInteger(stats.chapterCount) },
            { label: 'Verses', value: formatInteger(stats.verseCount) },
            {
              label: 'Verses with text',
              value: `${formatInteger(stats.textVerseCount)} (${formatShare(stats.textVerseCount, stats.verseCount)})`,
            },
            { label: 'Omitted verses', value: formatInteger(stats.omittedVerses.length) },
            { label: 'Words', value: formatInteger(stats.wordCount) },
            { label: 'Characters', value: formatInteger(stats.characterCount) },
            {
              label: 'Words per verse',
              value: formatDecimal(stats.wordCount / Math.max(stats.textVerseCount, 1)),
            },
            { label: 'Longest verse', value: <VerseMeasureValue measure={stats.longestVerse} /> },
            { label: 'Shortest verse', value: <VerseMeasureValue measure={stats.shortestVerse} /> },
          ]}
        />
      </div>

      <div>
        <h3 className={styles.subheading}>Omitted verses</h3>
        <p className={styles.inlineList}>
          {stats.omittedVerses.length === 0
            ? 'None.'
            : stats.omittedVerses.map((verse) => <VerseLink key={verse} verse={verse} />)}
        </p>
      </div>

      <div>
        <h3 className={styles.subheading}>Import notices</h3>
        <NoticeList notices={translation.notices} />
      </div>
    </Section>
  );
}
