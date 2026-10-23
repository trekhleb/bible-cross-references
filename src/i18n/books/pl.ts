import type { BookNames } from './types.ts';

/**
 * The books in Polish.
 *
 * Names and abbreviations follow the Biblia Tysiąclecia, whose sigla (`Rdz`, `Kpł`, `1 Kor`) are
 * the ones a Polish reader meets in nearly every printed Bible, commentary and lectionary,
 * Catholic or not. Names are the short forms used in citation — `Rodzaju`, `Rzymian` — rather
 * than `Księga Rodzaju` or `List do Rzymian`, which would not fit the panel's heading.
 *
 * Protestant readers, and the Uwspółcześniona Biblia Gdańska, cite the Pentateuch by Moses
 * (`1 Mojż`) and some books by other names (`Kaznodziei`, `Objawienie`), so those are accepted
 * as aliases: a reader types what their own Bible prints, and both traditions arrive.
 *
 * `ł` folds to `l`, so `Łk` is found by `lk` and `Kpł` by `kpl`; no two books meet under it.
 */
export const plBooks: BookNames = {
  Gen: {
    name: 'Rodzaju',
    abbreviation: 'Rdz',
    aliases: ['rdz', 'ks rodzaju', 'księga rodzaju', '1 mojż', '1 mojżeszowa', 'genesis'],
  },
  Exod: {
    name: 'Wyjścia',
    abbreviation: 'Wj',
    aliases: ['wj', 'wyj', 'księga wyjścia', '2 mojż', '2 mojżeszowa', 'exodus'],
  },
  Lev: {
    name: 'Kapłańska',
    abbreviation: 'Kpł',
    aliases: ['kpł', 'księga kapłańska', '3 mojż', '3 mojżeszowa', 'leviticus'],
  },
  Num: {
    name: 'Liczb',
    abbreviation: 'Lb',
    aliases: ['lb', 'księga liczb', '4 mojż', '4 mojżeszowa', 'numeri'],
  },
  Deut: {
    name: 'Powtórzonego Prawa',
    abbreviation: 'Pwt',
    aliases: ['pwt', 'księga powtórzonego prawa', '5 mojż', '5 mojżeszowa', 'deuteronomium'],
  },
  Josh: { name: 'Jozuego', abbreviation: 'Joz', aliases: ['joz', 'jozue', 'księga jozuego'] },
  Judg: { name: 'Sędziów', abbreviation: 'Sdz', aliases: ['sdz', 'sędz', 'księga sędziów'] },
  Ruth: { name: 'Rut', abbreviation: 'Rt', aliases: ['rt', 'księga rut'] },
  '1Sam': { name: '1 Samuela', abbreviation: '1Sm', aliases: ['1 sm', '1 sam'] },
  '2Sam': { name: '2 Samuela', abbreviation: '2Sm', aliases: ['2 sm', '2 sam'] },
  '1Kgs': {
    name: '1 Królewska',
    abbreviation: '1Krl',
    aliases: ['1 krl', '1 król', '1 królów', '1 królewska'],
  },
  '2Kgs': {
    name: '2 Królewska',
    abbreviation: '2Krl',
    aliases: ['2 krl', '2 król', '2 królów', '2 królewska'],
  },
  '1Chr': { name: '1 Kronik', abbreviation: '1Krn', aliases: ['1 krn', '1 kron'] },
  '2Chr': { name: '2 Kronik', abbreviation: '2Krn', aliases: ['2 krn', '2 kron'] },
  Ezra: { name: 'Ezdrasza', abbreviation: 'Ezd', aliases: ['ezd', 'ezdrasz'] },
  Neh: { name: 'Nehemiasza', abbreviation: 'Ne', aliases: ['ne', 'neh', 'nehemiasz'] },
  Esth: { name: 'Estery', abbreviation: 'Est', aliases: ['est', 'estera'] },
  Job: { name: 'Hioba', abbreviation: 'Hi', aliases: ['hi', 'hiob', 'hio', 'księga hioba'] },
  Ps: {
    name: 'Psalmy',
    referenceName: 'Psalm',
    abbreviation: 'Ps',
    aliases: ['ps', 'psalm', 'psalmów', 'księga psalmów'],
  },
  Prov: {
    name: 'Przysłów',
    abbreviation: 'Prz',
    aliases: ['prz', 'przyp', 'przypowieści salomona', 'księga przysłów'],
  },
  Eccl: {
    name: 'Koheleta',
    abbreviation: 'Koh',
    aliases: ['koh', 'kohelet', 'kazn', 'kaznodziei', 'kaznodziei salomona', 'eklezjastes'],
  },
  Song: {
    name: 'Pieśń nad Pieśniami',
    abbreviation: 'Pnp',
    aliases: ['pnp', 'pieśń', 'pieśń nad pieśniami'],
  },
  Isa: { name: 'Izajasza', abbreviation: 'Iz', aliases: ['iz', 'izaj', 'izajasz'] },
  Jer: { name: 'Jeremiasza', abbreviation: 'Jr', aliases: ['jr', 'jer', 'jeremiasz'] },
  Lam: {
    name: 'Lamentacje',
    abbreviation: 'Lm',
    aliases: ['lm', 'lam', 'treny', 'lamentacje jeremiasza'],
  },
  Ezek: { name: 'Ezechiela', abbreviation: 'Ez', aliases: ['ez', 'ezech', 'ezechiel'] },
  Dan: { name: 'Daniela', abbreviation: 'Dn', aliases: ['dn', 'dan', 'daniel'] },
  Hos: { name: 'Ozeasza', abbreviation: 'Oz', aliases: ['oz', 'ozeasz'] },
  Joel: { name: 'Joela', abbreviation: 'Jl', aliases: ['jl', 'joel'] },
  Amos: { name: 'Amosa', abbreviation: 'Am', aliases: ['am', 'amos'] },
  Obad: { name: 'Abdiasza', abbreviation: 'Ab', aliases: ['ab', 'abd', 'abdiasz'] },
  Jonah: { name: 'Jonasza', abbreviation: 'Jon', aliases: ['jon', 'jonasz'] },
  Mic: { name: 'Micheasza', abbreviation: 'Mi', aliases: ['mi', 'mich', 'micheasz'] },
  Nah: { name: 'Nahuma', abbreviation: 'Na', aliases: ['na', 'nah', 'nahum'] },
  Hab: { name: 'Habakuka', abbreviation: 'Ha', aliases: ['ha', 'hab', 'habakuk'] },
  Zeph: { name: 'Sofoniasza', abbreviation: 'So', aliases: ['so', 'sof', 'sofoniasz'] },
  Hag: { name: 'Aggeusza', abbreviation: 'Ag', aliases: ['ag', 'agg', 'aggeusz'] },
  Zech: { name: 'Zachariasza', abbreviation: 'Za', aliases: ['za', 'zach', 'zachariasz'] },
  Mal: { name: 'Malachiasza', abbreviation: 'Ml', aliases: ['ml', 'mal', 'malachiasz'] },
  Matt: {
    name: 'Mateusza',
    abbreviation: 'Mt',
    aliases: ['mt', 'mat', 'mateusz', 'ewangelia mateusza'],
  },
  Mark: {
    name: 'Marka',
    abbreviation: 'Mk',
    aliases: ['mk', 'mar', 'marek', 'ewangelia marka'],
  },
  Luke: {
    name: 'Łukasza',
    abbreviation: 'Łk',
    aliases: ['łk', 'łuk', 'łukasz', 'ewangelia łukasza'],
  },
  John: {
    name: 'Jana',
    abbreviation: 'J',
    aliases: ['j', 'jan', 'ewangelia jana'],
  },
  Acts: {
    name: 'Dzieje Apostolskie',
    abbreviation: 'Dz',
    aliases: ['dz', 'dzieje', 'dz ap'],
  },
  Rom: { name: 'Rzymian', abbreviation: 'Rz', aliases: ['rz', 'rzym', 'list do rzymian'] },
  '1Cor': { name: '1 Koryntian', abbreviation: '1Kor', aliases: ['1 kor'] },
  '2Cor': { name: '2 Koryntian', abbreviation: '2Kor', aliases: ['2 kor'] },
  Gal: { name: 'Galatów', abbreviation: 'Ga', aliases: ['ga', 'gal', 'galacjan'] },
  Eph: { name: 'Efezjan', abbreviation: 'Ef', aliases: ['ef', 'efez'] },
  Phil: { name: 'Filipian', abbreviation: 'Flp', aliases: ['flp', 'filip'] },
  Col: { name: 'Kolosan', abbreviation: 'Kol', aliases: ['kol'] },
  '1Thess': { name: '1 Tesaloniczan', abbreviation: '1Tes', aliases: ['1 tes', '1 tesal'] },
  '2Thess': { name: '2 Tesaloniczan', abbreviation: '2Tes', aliases: ['2 tes', '2 tesal'] },
  '1Tim': { name: '1 Tymoteusza', abbreviation: '1Tm', aliases: ['1 tm', '1 tym'] },
  '2Tim': { name: '2 Tymoteusza', abbreviation: '2Tm', aliases: ['2 tm', '2 tym'] },
  Titus: { name: 'Tytusa', abbreviation: 'Tt', aliases: ['tt', 'tyt', 'tytus'] },
  Phlm: { name: 'Filemona', abbreviation: 'Flm', aliases: ['flm', 'filem', 'filemon'] },
  Heb: { name: 'Hebrajczyków', abbreviation: 'Hbr', aliases: ['hbr', 'hebr'] },
  Jas: { name: 'Jakuba', abbreviation: 'Jk', aliases: ['jk', 'jak', 'jakub'] },
  '1Pet': { name: '1 Piotra', abbreviation: '1P', aliases: ['1 p', '1 pt', '1 piotr'] },
  '2Pet': { name: '2 Piotra', abbreviation: '2P', aliases: ['2 p', '2 pt', '2 piotr'] },
  '1John': { name: '1 Jana', abbreviation: '1J', aliases: ['1 j', '1 jan'] },
  '2John': { name: '2 Jana', abbreviation: '2J', aliases: ['2 j', '2 jan'] },
  '3John': { name: '3 Jana', abbreviation: '3J', aliases: ['3 j', '3 jan'] },
  Jude: { name: 'Judy', abbreviation: 'Jud', aliases: ['jud', 'juda'] },
  Rev: {
    name: 'Apokalipsa',
    abbreviation: 'Ap',
    aliases: ['ap', 'apok', 'obj', 'objawienie', 'objawienie jana', 'objawienie świętego jana'],
  },
};
