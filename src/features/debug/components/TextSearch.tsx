import { useMemo, useState, type SubmitEvent } from 'react';
import { formatInteger } from '../../../shared/lib/format.ts';
import { DataTable } from '../../../shared/ui/DataTable.tsx';
import { SearchIcon } from '../../../shared/ui/icons.tsx';
import { Section } from '../../../shared/ui/Section.tsx';
import type { Translation } from '../../../translations/translation.ts';
import styles from '../DebugPage.module.css';
import { VerseLink } from './VerseLink.tsx';

const RESULT_LIMIT = 100;

interface TextSearchProps {
  readonly id: string;
  readonly translation: Translation;
}

export function TextSearch({ id, translation }: TextSearchProps) {
  const [query, setQuery] = useState('');
  const result = useMemo(() => translation.search(query, RESULT_LIMIT), [translation, query]);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = new FormData(event.currentTarget).get('query');
    setQuery(typeof input === 'string' ? input.trim() : '');
  };

  return (
    <Section
      id={id}
      title="Text search"
      description={`Case-insensitive phrase search in the ${translation.manifest.abbreviation} text.`}
    >
      <form className={styles.toolbar} onSubmit={handleSubmit}>
        <input
          name="query"
          type="search"
          className={styles.input}
          placeholder="e.g. living water"
          aria-label="Search text"
        />
        <button type="submit" className={styles.button}>
          <SearchIcon />
          Search
        </button>
      </form>
      {query !== '' && (
        <>
          <p className={styles.muted}>
            {formatInteger(result.totalCount)} verses contain “{query}”
            {result.totalCount > RESULT_LIMIT && `; showing the first ${RESULT_LIMIT}`}.
          </p>
          <DataTable
            rows={result.verses}
            rowKey={(verse) => verse}
            emptyMessage="No verses match."
            columns={[
              { header: 'Verse', render: (verse) => <VerseLink verse={verse} /> },
              { header: 'Text', render: (verse) => translation.verseText(verse) },
            ]}
          />
        </>
      )}
    </Section>
  );
}
