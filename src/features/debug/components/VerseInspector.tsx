import { useState, type SubmitEvent } from 'react';
import { formatVerseRef } from '../../../core/bible/reference-format.ts';
import { parseReference } from '../../../core/bible/reference-parse.ts';
import { toOsisId, type VerseIndex } from '../../../core/bible/verse-ref.ts';
import type { CrossReferenceLink } from '../../../cross-references/cross-reference-index.ts';
import type { CrossReferenceDataset } from '../../../cross-references/load-cross-references.ts';
import { formatInteger } from '../../../shared/lib/format.ts';
import { DataTable, type DataTableColumn } from '../../../shared/ui/DataTable.tsx';
import { NextIcon, PreviousIcon, SearchIcon } from '../../../shared/ui/icons.tsx';
import { Section } from '../../../shared/ui/Section.tsx';
import type { Translation } from '../../../translations/translation.ts';
import styles from '../DebugPage.module.css';
import { useSelectVerse } from '../verse-navigation.ts';
import { VerseLink } from './VerseLink.tsx';

interface VerseInspectorProps {
  readonly id: string;
  readonly verse: VerseIndex;
  readonly translation: Translation;
  readonly datasets: readonly CrossReferenceDataset[];
}

function byVotesDescending(a: CrossReferenceLink, b: CrossReferenceLink): number {
  return b.votes - a.votes || a.targetStart - b.targetStart;
}

function parseMinVotes(value: string): number | null {
  const number = Number(value);
  return value.trim() === '' || !Number.isFinite(number) ? null : number;
}

export function VerseInspector({ id, verse, translation, datasets }: VerseInspectorProps) {
  const selectVerse = useSelectVerse();
  const [error, setError] = useState<string | null>(null);
  const [minVotes, setMinVotes] = useState<number | null>(null);
  const { versification } = translation;
  const ref = versification.refAt(verse);
  const text = translation.verseText(verse);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = new FormData(event.currentTarget).get('reference');
    const result = parseReference(typeof input === 'string' ? input : '', versification);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    // A chapter-only reference opens the chapter's first verse.
    const { book, chapter, verse: verseNumber = 1 } = result.reference;
    const index = versification.indexOf({ book, chapter, verse: verseNumber });
    if (index === undefined) {
      setError('This verse does not exist.');
      return;
    }
    setError(null);
    selectVerse(index);
  };

  const preview = (link: CrossReferenceLink, verseOfLink: VerseIndex) => {
    const verseText = translation.verseText(verseOfLink) || '(omitted in this translation)';
    const extraVerses = link.targetEnd - link.targetStart;
    return verseOfLink === link.targetStart && extraVerses > 0
      ? `${verseText} … (+${extraVerses} more)`
      : verseText;
  };
  const votesColumn: DataTableColumn<CrossReferenceLink> = {
    header: 'Votes',
    align: 'end',
    render: (link) => (
      <span className={link.votes < 0 ? styles.negative : undefined}>
        {formatInteger(link.votes)}
      </span>
    ),
  };
  const idColumn: DataTableColumn<CrossReferenceLink> = {
    header: 'Link ID',
    align: 'end',
    render: (link) => <code>{link.id}</code>,
  };
  const keep = (link: CrossReferenceLink) => minVotes === null || link.votes >= minVotes;

  return (
    <Section
      id={id}
      title="Verse inspector"
      description="Look up any verse and debug its cross-references. Accepts references like “John 3:16”, “jn 3 16”, “1co13:4”, “Ps 23” or “Gen.1.1”."
    >
      <form key={verse} className={styles.toolbar} onSubmit={handleSubmit}>
        <input
          name="reference"
          className={styles.input}
          defaultValue={formatVerseRef(ref)}
          aria-label="Bible reference"
          autoComplete="off"
        />
        <button type="submit" className={styles.button}>
          <SearchIcon />
          Inspect
        </button>
        <button
          type="button"
          className={styles.button}
          disabled={verse === 0}
          onClick={() => {
            selectVerse(verse - 1);
          }}
        >
          <PreviousIcon />
          Previous
        </button>
        <button
          type="button"
          className={styles.button}
          disabled={verse === versification.verseCount - 1}
          onClick={() => {
            selectVerse(verse + 1);
          }}
        >
          Next
          <NextIcon />
        </button>
      </form>
      {error !== null && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      <article className={styles.verseCard}>
        <h3 className={styles.verseTitle}>{formatVerseRef(ref)}</h3>
        <p className={styles.verseText}>
          {text || <em>Omitted in the {translation.manifest.abbreviation}.</em>}
        </p>
        <p className={styles.muted}>
          OSIS <code>{toOsisId(ref)}</code> · canonical index <code>{verse}</code> ·{' '}
          {translation.manifest.abbreviation}
        </p>
      </article>

      <label className={styles.toolbar}>
        Minimum votes
        <input
          type="number"
          className={styles.numberInput}
          value={minVotes ?? ''}
          placeholder="any"
          onChange={(event) => {
            setMinVotes(parseMinVotes(event.target.value));
          }}
        />
      </label>

      {datasets.map(({ manifest, index }) => {
        const outgoing = index.outgoing(verse).sort(byVotesDescending);
        const incoming = index.incoming(verse).sort(byVotesDescending);
        const shownOutgoing = outgoing.filter(keep);
        const shownIncoming = incoming.filter(keep);
        return (
          <div key={manifest.id} className={styles.stack}>
            <h3 className={styles.subheading}>{manifest.name}</h3>
            <DataTable
              caption={`Outgoing links: ${formatInteger(shownOutgoing.length)} of ${formatInteger(outgoing.length)}`}
              rows={shownOutgoing}
              rowKey={(link) => link.id}
              emptyMessage="No outgoing links."
              columns={[
                {
                  header: 'To',
                  render: (link) => (
                    <VerseLink verse={link.targetStart} rangeEnd={link.targetEnd} />
                  ),
                },
                votesColumn,
                { header: 'Text', render: (link) => preview(link, link.targetStart) },
                idColumn,
              ]}
            />
            <DataTable
              caption={`Incoming links: ${formatInteger(shownIncoming.length)} of ${formatInteger(incoming.length)}`}
              rows={shownIncoming}
              rowKey={(link) => link.id}
              emptyMessage="No incoming links."
              columns={[
                { header: 'From', render: (link) => <VerseLink verse={link.from} /> },
                {
                  header: 'Target',
                  render: (link) =>
                    link.targetStart === link.targetEnd ? (
                      'this verse'
                    ) : (
                      <VerseLink verse={link.targetStart} rangeEnd={link.targetEnd} />
                    ),
                },
                votesColumn,
                { header: 'Text', render: (link) => preview(link, link.from) },
                idColumn,
              ]}
            />
          </div>
        );
      })}
    </Section>
  );
}
