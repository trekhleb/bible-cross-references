import type { Testament } from '../../../core/bible/books.ts';
import { GENRES, type GenreId } from '../../../core/bible/genres.ts';
import { GENRE_COLORS } from '../palette.ts';
import styles from './GenreLegend.module.css';

export interface GenreTogglesProps {
  readonly hiddenGenres: ReadonlySet<GenreId>;
  readonly onToggle: (genre: GenreId) => void;
}

const TESTAMENTS: readonly { readonly id: Testament; readonly label: string }[] = [
  { id: 'OT', label: 'Old Testament' },
  { id: 'NT', label: 'New Testament' },
];

/** The genre color keys, grouped by testament; each also toggles its genre's links. */
export function GenreToggles({ hiddenGenres, onToggle }: GenreTogglesProps) {
  return (
    <div className={styles.columns}>
      {TESTAMENTS.map((testament) => (
        <div key={testament.id} className={styles.testament}>
          <p className={styles.heading}>{testament.label}</p>
          {GENRES.filter((genre) => genre.testament === testament.id).map((genre) => (
            <button
              key={genre.id}
              type="button"
              className={styles.item}
              aria-pressed={!hiddenGenres.has(genre.id)}
              title={hiddenGenres.has(genre.id) ? `Show ${genre.name}` : `Hide ${genre.name}`}
              onClick={() => {
                onToggle(genre.id);
              }}
            >
              <span className={styles.key} style={{ background: GENRE_COLORS[genre.id] }} />
              {genre.name}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Toggles a genre in an immutable set. */
export function toggleGenre(hidden: ReadonlySet<GenreId>, genre: GenreId): ReadonlySet<GenreId> {
  const next = new Set(hidden);
  if (!next.delete(genre)) {
    next.add(genre);
  }
  return next;
}
