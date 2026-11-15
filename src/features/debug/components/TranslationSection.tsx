import { t } from '../../../locales/ui.ts';
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
      <VerseLink verse={measure.verse} /> ({formatInteger(measure.value)} {t('words)')}
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
      title={t(t('Translation · {name}'), { name: manifest.name })}
      description={t(
        'The Bible text displayed by the app. Translations are plugins registered in src/translations/registry.ts.',
      )}
    >
      <SourceDetails
        items={[
          { label: t('ID'), value: <code>{manifest.id}</code> },
          { label: t('Abbreviation'), value: manifest.abbreviation },
          { label: t('Language'), value: `${manifest.language} (${manifest.direction})` },
          { label: t('Versification'), value: manifest.versification.toUpperCase() },
          { label: t('Access'), value: manifest.access },
        ]}
        license={manifest.license}
        attribution={manifest.attribution}
        homepage={manifest.homepage}
        provenance={translation.provenance}
      />

      <div>
        <h3 className={styles.subheading}>{t('Text statistics')}</h3>
        <KeyValueList
          items={[
            { label: t('Books'), value: formatInteger(stats.bookCount) },
            { label: t('Chapters'), value: formatInteger(stats.chapterCount) },
            { label: t('Verses'), value: formatInteger(stats.verseCount) },
            {
              label: t('Verses with text'),
              value: `${formatInteger(stats.textVerseCount)} (${formatShare(stats.textVerseCount, stats.verseCount)})`,
            },
            {
              label: t(manifest.previewNotice ? 'Unresolved verses' : 'Omitted verses'),
              value: formatInteger(stats.omittedVerses.length),
            },
            { label: t('Words'), value: formatInteger(stats.wordCount) },
            { label: t('Characters'), value: formatInteger(stats.characterCount) },
            {
              label: t('Words per verse'),
              value: formatDecimal(stats.wordCount / Math.max(stats.textVerseCount, 1)),
            },
            {
              label: t('Longest verse'),
              value: <VerseMeasureValue measure={stats.longestVerse} />,
            },
            {
              label: t('Shortest verse'),
              value: <VerseMeasureValue measure={stats.shortestVerse} />,
            },
          ]}
        />
      </div>

      <div>
        <h3 className={styles.subheading}>
          {t(translation.manifest.previewNotice ? 'Unresolved verses' : 'Omitted verses')}
        </h3>
        <p className={styles.inlineList}>
          {stats.omittedVerses.length === 0
            ? t('None.')
            : stats.omittedVerses.map((verse) => <VerseLink key={verse} verse={verse} />)}
        </p>
      </div>

      <div>
        <h3 className={styles.subheading}>{t('Import notices')}</h3>
        <NoticeList notices={translation.notices} />
      </div>
    </Section>
  );
}
