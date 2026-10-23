import type { GenreId } from '../../core/bible/genres.ts';

/** The ten genres in Polish. */
export const plGenres: Readonly<Record<GenreId, string>> = {
  law: 'Prawo',
  history: 'Księgi historyczne',
  poetry: 'Poezja i mądrość',
  'major-prophets': 'Prorocy więksi',
  'minor-prophets': 'Prorocy mniejsi',
  gospels: 'Ewangelie',
  acts: 'Dzieje',
  'pauline-epistles': 'Listy Pawła',
  'general-epistles': 'Listy powszechne',
  revelation: 'Apokalipsa',
};
