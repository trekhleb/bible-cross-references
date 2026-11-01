import type { GenreId } from '../../core/bible/genres.ts';
export const slGenres: Readonly<Record<GenreId, string>> = {
  law: 'Postava',
  history: 'Zgodovina',
  poetry: 'Poezija in modrost',
  'major-prophets': 'Veliki preroki',
  'minor-prophets': 'Mali preroki',
  gospels: 'Evangeliji',
  acts: 'Apostolska dela',
  'pauline-epistles': 'Pavlova pisma',
  'general-epistles': 'Splošna pisma',
  revelation: 'Razodetje',
};
