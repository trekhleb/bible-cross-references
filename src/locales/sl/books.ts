import type { BookId } from '../../core/bible/books.ts';

export interface SlovenianBookLabel {
  readonly name: string;
  /** Heading in the 1914 TXT contents; OCR punctuation/page numbers cleaned. */
  readonly sourceTitle: string;
  readonly aliases: readonly string[];
}

/**
 * Chráska 1914 book names, keyed by stable OSIS IDs. Historical alternate numbering
 * in parentheses is metadata only, never a search alias: Samuel and Kings must stay distinct.
 * Matevž/Lukež follow this edition; Matej/Luka are additional search aliases.
 */
export const SLOVENIAN_BOOKS: Readonly<Record<BookId, SlovenianBookLabel>> = {
  Gen: {
    name: '1. Mojzesova',
    sourceTitle: 'Prva knjiga Mojzesova (Genesis)',
    aliases: ['1 Mz', '1 Mojz', 'Prva Mojzesova'],
  },
  Exod: {
    name: '2. Mojzesova',
    sourceTitle: 'Druga knjiga Mojzesova (Eksodus)',
    aliases: ['2 Mz', '2 Mojz', 'Druga Mojzesova'],
  },
  Lev: {
    name: '3. Mojzesova',
    sourceTitle: 'Tretja knjiga Mojzesova (Levitikus)',
    aliases: ['3 Mz', '3 Mojz', 'Tretja Mojzesova'],
  },
  Num: {
    name: '4. Mojzesova',
    sourceTitle: 'Četrta knjiga Mojzesova (Numeri)',
    aliases: ['4 Mz', '4 Mojz', 'Četrta Mojzesova'],
  },
  Deut: {
    name: '5. Mojzesova',
    sourceTitle: 'Peta knjiga Mojzesova (Deuteronomium)',
    aliases: ['5 Mz', '5 Mojz', 'Peta Mojzesova'],
  },
  Josh: { name: 'Jozue', sourceTitle: 'Knjiga Jozuetova', aliases: ['Joz', 'Jozuetova'] },
  Judg: { name: 'Sodniki', sourceTitle: 'Knjiga Sodnikov', aliases: ['Sod'] },
  Ruth: { name: 'Ruta', sourceTitle: 'Knjiga Rutina', aliases: ['Rut', 'Rutina'] },
  '1Sam': {
    name: '1. Samuelova',
    sourceTitle: 'Prva knjiga Samuelova (Prva knjiga Kraljev)',
    aliases: ['1 Sam', 'Prva Samuelova'],
  },
  '2Sam': {
    name: '2. Samuelova',
    sourceTitle: 'Druga knjiga Samuelova (Druga knjiga Kraljev)',
    aliases: ['2 Sam', 'Druga Samuelova'],
  },
  '1Kgs': {
    name: '1. Kraljev',
    sourceTitle: 'Prva knjiga Kraljev (Tretja knjiga Kraljev)',
    aliases: ['1 Kr', 'Prva Kraljev'],
  },
  '2Kgs': {
    name: '2. Kraljev',
    sourceTitle: 'Druga knjiga Kraljev (Četrta knjiga Kraljev)',
    aliases: ['2 Kr', 'Druga Kraljev'],
  },
  '1Chr': {
    name: '1. Letopisov',
    sourceTitle: 'Prva knjiga Letopisov',
    aliases: ['1 Let', 'Prva Letopisov'],
  },
  '2Chr': {
    name: '2. Letopisov',
    sourceTitle: 'Druga knjiga Letopisov',
    aliases: ['2 Let', 'Druga Letopisov'],
  },
  Ezra: { name: 'Ezra', sourceTitle: 'Knjiga Ezrova', aliases: ['Ezrova'] },
  Neh: { name: 'Nehemija', sourceTitle: 'Knjiga Nehemijeva', aliases: ['Nehemijeva', 'Neh'] },
  Esth: { name: 'Estera', sourceTitle: 'Knjiga Esterina', aliases: ['Esterina', 'Est'] },
  Job: { name: 'Job', sourceTitle: 'Knjiga Jobova', aliases: ['Jobova'] },
  Ps: { name: 'Psalmi', sourceTitle: 'Psalmi', aliases: ['Psalm', 'Ps'] },
  Prov: { name: 'Pregovori', sourceTitle: 'Pregovori', aliases: ['Prg'] },
  Eccl: { name: 'Propovednik', sourceTitle: 'Propovednik', aliases: ['Prp', 'Pridigar'] },
  Song: { name: 'Visoka pesem', sourceTitle: 'Visoka pesem', aliases: ['Vp'] },
  Isa: { name: 'Izaija', sourceTitle: 'Izaija', aliases: ['Iz'] },
  Jer: { name: 'Jeremija', sourceTitle: 'Jeremija', aliases: ['Jer'] },
  Lam: {
    name: 'Žalostinke',
    sourceTitle: 'Žalostinke Jeremijeve',
    aliases: ['Žal', 'Žalostinke Jeremija'],
  },
  Ezek: { name: 'Ezekiel', sourceTitle: 'Ezekiel', aliases: ['Ezk'] },
  Dan: { name: 'Daniel', sourceTitle: 'Daniel', aliases: ['Dan'] },
  Hos: { name: 'Ozea', sourceTitle: 'Ozea', aliases: ['Oz', 'Ozej'] },
  Joel: { name: 'Joel', sourceTitle: 'Joel', aliases: ['Jl'] },
  Amos: { name: 'Amos', sourceTitle: 'Amos', aliases: ['Am'] },
  Obad: { name: 'Obadija', sourceTitle: 'Obadija', aliases: ['Obd'] },
  Jonah: { name: 'Jona', sourceTitle: 'Jona', aliases: ['Jon'] },
  Mic: { name: 'Miha', sourceTitle: 'Miha', aliases: ['Mih'] },
  Nah: { name: 'Nahum', sourceTitle: 'Nahum', aliases: ['Nah'] },
  Hab: { name: 'Habakuk', sourceTitle: 'Habakuk', aliases: ['Hab'] },
  Zeph: { name: 'Zefanija', sourceTitle: 'Zefanija', aliases: ['Zef'] },
  Hag: { name: 'Hagaj', sourceTitle: 'Hagaj', aliases: ['Hag'] },
  Zech: { name: 'Zaharija', sourceTitle: 'Zaharija', aliases: ['Zah'] },
  Mal: { name: 'Malahija', sourceTitle: 'Malahija', aliases: ['Mal'] },
  Matt: {
    name: 'Matevž',
    sourceTitle: 'Evangelij po sv. Matevžu',
    aliases: ['Matej', 'Mt', 'Sv. Matevž'],
  },
  Mark: { name: 'Marko', sourceTitle: 'Evangelij po sv. Marku', aliases: ['Mr', 'Sv. Marko'] },
  Luke: {
    name: 'Lukež',
    sourceTitle: 'Evangelij po sv. Lukežu',
    aliases: ['Luka', 'Lk', 'Sv. Lukež'],
  },
  John: { name: 'Janez', sourceTitle: 'Evangelij po sv. Janezu', aliases: ['Jn', 'Sv. Janez'] },
  Acts: {
    name: 'Dejanja',
    sourceTitle: 'Dejanja sv. apostolov',
    aliases: ['Apd', 'Apostolska dela'],
  },
  Rom: { name: 'Rimljanom', sourceTitle: 'List apostola Pavla Rimljanom', aliases: ['Rim'] },
  '1Cor': {
    name: '1. Korinčanom',
    sourceTitle: 'Korinčanom, prvi',
    aliases: ['1 Kor', 'Prvi list Korinčanom'],
  },
  '2Cor': {
    name: '2. Korinčanom',
    sourceTitle: 'Korinčanom, drugi',
    aliases: ['2 Kor', 'Drugi list Korinčanom'],
  },
  Gal: { name: 'Galatom', sourceTitle: 'Galatom', aliases: ['Gal'] },
  Eph: { name: 'Efežanom', sourceTitle: 'Efežanom', aliases: ['Ef'] },
  Phil: { name: 'Filipljanom', sourceTitle: 'Filipljanom', aliases: ['Flp'] },
  Col: { name: 'Kološanom', sourceTitle: 'Kološanom', aliases: ['Kol'] },
  '1Thess': {
    name: '1. Tesaloničanom',
    sourceTitle: 'Tesaloničanom, prvi',
    aliases: ['1 Tes', 'Prvi list Tesaloničanom'],
  },
  '2Thess': {
    name: '2. Tesaloničanom',
    sourceTitle: 'Tesaloničanom, drugi',
    aliases: ['2 Tes', 'Drugi list Tesaloničanom'],
  },
  '1Tim': {
    name: '1. Timoteju',
    sourceTitle: 'Timoteju, prvi',
    aliases: ['1 Tim', 'Prvi list Timoteju'],
  },
  '2Tim': {
    name: '2. Timoteju',
    sourceTitle: 'Timoteju, drugi',
    aliases: ['2 Tim', 'Drugi list Timoteju'],
  },
  Titus: { name: 'Titu', sourceTitle: 'Titu', aliases: ['Tit'] },
  Phlm: { name: 'Filemonu', sourceTitle: 'Filemonu', aliases: ['Flm'] },
  Heb: { name: 'Hebrejcem', sourceTitle: 'Hebrejcem', aliases: ['Heb'] },
  Jas: { name: 'Jakobov list', sourceTitle: 'Splošni list Jakobov', aliases: ['Jakob', 'Jak'] },
  '1Pet': {
    name: '1. Petrov list',
    sourceTitle: 'Petrov, prvi',
    aliases: ['1 Peter', '1 Pt', 'Prvi Petrov list'],
  },
  '2Pet': {
    name: '2. Petrov list',
    sourceTitle: 'Petrov, drugi',
    aliases: ['2 Peter', '2 Pt', 'Drugi Petrov list'],
  },
  '1John': {
    name: '1. Janezov list',
    sourceTitle: 'Janezov, prvi',
    aliases: ['1 Janez', '1 Jn', 'Prvi Janezov list'],
  },
  '2John': {
    name: '2. Janezov list',
    sourceTitle: 'Janezov, drugi',
    aliases: ['2 Janez', '2 Jn', 'Drugi Janezov list'],
  },
  '3John': {
    name: '3. Janezov list',
    sourceTitle: 'Janezov, tretji',
    aliases: ['3 Janez', '3 Jn', 'Tretji Janezov list'],
  },
  Jude: { name: 'Judov list', sourceTitle: 'Judov', aliases: ['Juda', 'Jud'] },
  Rev: { name: 'Razodetje', sourceTitle: 'Razodetje sv. Janeza', aliases: ['Raz'] },
};
