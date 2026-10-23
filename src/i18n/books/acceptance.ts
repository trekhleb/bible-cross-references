import type { LocaleId } from '../locale-id.ts';

/**
 * What a reader of each language types into the search box, and what it must find.
 *
 * A language's book names pass every other check in `completeness.ts` without anybody having
 * read them: nothing is blank, no two books claim one spelling, every name is there. None of
 * that says whether `Jo` means John or Job — and in Portuguese it is the whole question, because
 * `Jo` is how a Brazilian writes João and `Jó` is Job, one accent apart.
 *
 * `bookNameCollisions` cannot answer it either: it proves two books never claim the same
 * spelling, not which of them a reader reaches. `Jo` finds João only because João's abbreviation
 * claims that exact spelling first; change João's abbreviation and `Jo` would quietly become Job,
 * with every check still green and every Brazilian typing `Jo 3:16` landing in Job.
 *
 * So each language carries the cases a native speaker signed off on, and they are run through
 * the real parser. The Portuguese rows below are the ones a Brazilian reader checked by hand.
 * `completeness.ts` requires a row for every spelling that folding makes ambiguous
 * (`contestedSpellings`), and names the missing ones, so a new language is told exactly which
 * cases it has to pin rather than being left to guess.
 */
export interface AcceptanceCase {
  /** Exactly what is typed, accents and all. */
  readonly typed: string;
  /**
   * What must come back:
   *
   * - `Book.chapter` or `Book.chapter.verse` — an OSIS reference, e.g. `John.3.16`, `Ps.23`;
   * - `ambiguous:A,B,C` — the reader is asked which book they meant, and these are the choices;
   * - `unknown` — no book of that name.
   */
  readonly expect: string;
  /** Why this row is here. A reviewer should be able to tell without reading the parser. */
  readonly note: string;
}

export const BOOK_ACCEPTANCE: Readonly<Record<LocaleId, readonly AcceptanceCase[]>> = {
  en: [
    { typed: 'John 3:16', expect: 'John.3.16', note: 'The plain case: a full name and a verse.' },
    { typed: 'Gen 1:1', expect: 'Gen.1.1', note: 'The usual abbreviation.' },
    { typed: 'Ps 23', expect: 'Ps.23', note: 'A whole chapter, with no verse.' },
    { typed: 'Job 1:1', expect: 'Job.1.1', note: 'Job is a whole name in English, not an accent.' },
    {
      typed: 'Jo 3:16',
      expect: 'ambiguous:Josh,Job,Joel,Jonah,John',
      note: 'English has no book called Jo, so the reader is asked which of the five they meant. In Portuguese this same spelling is João — see below.',
    },
    { typed: '1 Cor 13', expect: '1Cor.13', note: 'A numbered book, written with a space.' },
    { typed: '1co13', expect: '1Cor.13', note: 'The same with nothing between any of it.' },
    { typed: 'II Kings 2', expect: '2Kgs.2', note: 'A roman numeral for the number.' },
    { typed: 'Rev 22:21', expect: 'Rev.22.21', note: 'The last verse of the Bible.' },
    { typed: 'Habbakuk 1', expect: 'unknown', note: 'A misspelling is not quietly corrected.' },
  ],
  pt: [
    // The four a Brazilian reader checked by hand, and the reason this table exists.
    {
      typed: 'Jo 3:16',
      expect: 'John.3.16',
      note: 'Jo is how João is written. This is the one that matters: the same spelling is ambiguous in English and exact here.',
    },
    {
      typed: 'Jó 1:1',
      expect: 'Job.1.1',
      note: 'Jó is Job. One accent is the whole difference from the row above.',
    },
    { typed: 'Sl 23', expect: 'Ps.23', note: 'Sl is how Salmos is abbreviated.' },
    { typed: 'João 3:16', expect: 'John.3.16', note: 'The full name, written properly.' },
    { typed: 'joao 3:16', expect: 'John.3.16', note: 'The full name as it is typed on a phone.' },
    { typed: 'Gênesis 1:1', expect: 'Gen.1.1', note: 'An accented name.' },
    { typed: 'genesis 1:1', expect: 'Gen.1.1', note: 'The same without its accent.' },
    { typed: 'Josué 1:9', expect: 'Josh.1.9', note: 'Another accented name.' },
    { typed: 'josue 1:9', expect: 'Josh.1.9', note: 'And without it.' },
    { typed: 'Salmos 23', expect: 'Ps.23', note: 'A whole chapter by its full name.' },
    { typed: 'Êxodo 3:14', expect: 'Exod.3.14', note: 'An accent on the first letter.' },
    { typed: 'exodo 3:14', expect: 'Exod.3.14', note: 'And without it.' },
    { typed: '1 Coríntios 13', expect: '1Cor.13', note: 'A numbered book.' },
    {
      typed: '1º Coríntios 13',
      expect: '1Cor.13',
      note: 'With the ordinal marker Portuguese writes after the numeral.',
    },
    { typed: 'Tiago 1:1', expect: 'Jas.1.1', note: 'A name that shares nothing with the English.' },
    { typed: 'Jz 5', expect: 'Judg.5', note: 'An abbreviation of an accented name (Juízes).' },
    { typed: 'Apocalipse 22:21', expect: 'Rev.22.21', note: 'The last verse of the Bible.' },

    // Every accented name and abbreviation, typed the way a phone keyboard produces it. The
    // gate requires one of these per accented spelling: it is the only way the unaccented form
    // is pinned to a book at all, and it has to hold whether or not two books happen to
    // compete for it today.
    { typed: 'ex 1:1', expect: 'Exod.1.1', note: 'Êx, typed without its accent.' },
    { typed: 'levitico 1:1', expect: 'Lev.1.1', note: 'Levítico, typed without its accent.' },
    { typed: 'numeros 1:1', expect: 'Num.1.1', note: 'Números, typed without its accent.' },
    {
      typed: 'deuteronomio 1:1',
      expect: 'Deut.1.1',
      note: 'Deuteronômio, typed without its accent.',
    },
    { typed: 'juizes 1:1', expect: 'Judg.1.1', note: 'Juízes, typed without its accent.' },
    { typed: '1cronicas 1:1', expect: '1Chr.1.1', note: '1 Crônicas, typed without its accent.' },
    { typed: '2cronicas 1:1', expect: '2Chr.1.1', note: '2 Crônicas, typed without its accent.' },
    { typed: 'proverbios 1:1', expect: 'Prov.1.1', note: 'Provérbios, typed without its accent.' },
    { typed: 'canticos 1:1', expect: 'Song.1.1', note: 'Cânticos, typed without its accent.' },
    { typed: 'isaias 1:1', expect: 'Isa.1.1', note: 'Isaías, typed without its accent.' },
    { typed: 'lamentacoes 1:1', expect: 'Lam.1.1', note: 'Lamentações, typed without its accent.' },
    { typed: 'amos 1:1', expect: 'Amos.1.1', note: 'Amós, typed without its accent.' },
    { typed: '1corintios 1:1', expect: '1Cor.1.1', note: '1 Coríntios, typed without its accent.' },
    { typed: '2corintios 1:1', expect: '2Cor.1.1', note: '2 Coríntios, typed without its accent.' },
    { typed: 'galatas 1:1', expect: 'Gal.1.1', note: 'Gálatas, typed without its accent.' },
    { typed: 'efesios 1:1', expect: 'Eph.1.1', note: 'Efésios, typed without its accent.' },
    { typed: '1timoteo 1:1', expect: '1Tim.1.1', note: '1 Timóteo, typed without its accent.' },
    { typed: '2timoteo 1:1', expect: '2Tim.1.1', note: '2 Timóteo, typed without its accent.' },
    { typed: '1joao 1:1', expect: '1John.1.1', note: '1 João, typed without its accent.' },
    { typed: '2joao 1:1', expect: '2John.1.1', note: '2 João, typed without its accent.' },
    { typed: '3joao 1:1', expect: '3John.1.1', note: '3 João, typed without its accent.' },
  ],
  de: [
    { typed: 'Joh 3,16', expect: 'John.3.16', note: 'German cites with a comma, not a colon.' },
    { typed: 'Joh 3:16', expect: 'John.3.16', note: 'And with a colon, which many people type.' },
    {
      typed: '1. Mose 1,1',
      expect: 'Gen.1.1',
      note: 'The Lutherbibel calls Genesis 1. Mose, and that is what a German reader types.',
    },
    { typed: '1Mo 1,1', expect: 'Gen.1.1', note: 'The same, abbreviated and closed up.' },
    {
      typed: 'Genesis 1,1',
      expect: 'Gen.1.1',
      note: 'The Latin name, which a Catholic Bible prints and a student learned.',
    },
    { typed: 'Ps 23', expect: 'Ps.23', note: 'A whole chapter, with no verse.' },
    { typed: 'Röm 8,28', expect: 'Rom.8.28', note: 'An umlaut in the abbreviation.' },
    { typed: 'rom 8,28', expect: 'Rom.8.28', note: 'And the same typed without it.' },
    { typed: 'Hebräer 11,1', expect: 'Heb.11.1', note: 'An umlaut in the name.' },
    { typed: 'hebraer 11,1', expect: 'Heb.11.1', note: 'And without it.' },
    { typed: 'Matthäus 5,9', expect: 'Matt.5.9', note: 'Another umlaut name.' },
    { typed: 'matthaeus 5,9', expect: 'Matt.5.9', note: 'Written the way a keyboard spells it.' },
    { typed: 'Sprüche 3,5', expect: 'Prov.3.5', note: 'And another.' },
    { typed: 'sprueche 3,5', expect: 'Prov.3.5', note: 'With ue for ü.' },
    { typed: '1. Könige 3,9', expect: '1Kgs.3.9', note: 'A numbered book with an umlaut.' },
    { typed: '1koen 3,9', expect: '1Kgs.3.9', note: 'And its keyboard spelling.' },
    { typed: 'Apg 2,42', expect: 'Acts.2.42', note: 'The abbreviation everyone uses for Acts.' },
    { typed: 'Offb 22,21', expect: 'Rev.22.21', note: 'The last verse of the Bible.' },
    {
      typed: 'Hiob 1,1',
      expect: 'Job.1.1',
      note: 'Luther calls Job Hiob; Ijob is the other form.',
    },
    { typed: 'Ijob 1,1', expect: 'Job.1.1', note: 'And the Catholic form is understood too.' },
    { typed: 'Habbakuk 1', expect: 'unknown', note: 'A misspelling is not quietly corrected.' },

    // Every name and abbreviation carrying an umlaut, typed the way a keyboard without one
    // produces it. The gate asks for one row per folded spelling, because folding is the only
    // reason the plain form reaches a book at all.
    { typed: '1konige 3,9', expect: '1Kgs.3.9', note: '1. Könige, typed without its umlaut.' },
    { typed: '1kon 3,9', expect: '1Kgs.3.9', note: 'And its abbreviation.' },
    { typed: '2konige 2,11', expect: '2Kgs.2.11', note: '2. Könige, typed without its umlaut.' },
    { typed: '2kon 2,11', expect: '2Kgs.2.11', note: 'And its abbreviation.' },
    { typed: 'spruche 3,5', expect: 'Prov.3.5', note: 'Sprüche, typed without its umlaut.' },
    { typed: 'matthaus 5,9', expect: 'Matt.5.9', note: 'Matthäus, typed without its umlaut.' },
    { typed: 'romer 8,28', expect: 'Rom.8.28', note: 'Römer, typed without its umlaut.' },
  ],
  it: [
    { typed: 'Gv 3:16', expect: 'John.3.16', note: 'The plain case: the usual abbreviation.' },
    { typed: 'Giovanni 3:16', expect: 'John.3.16', note: 'And the full name.' },
    { typed: 'Genesi 1:1', expect: 'Gen.1.1', note: 'The first verse, by its full name.' },
    { typed: 'Sal 23', expect: 'Ps.23', note: 'A whole chapter, with no verse.' },
    {
      typed: 'Giosuè 1:9',
      expect: 'Josh.1.9',
      note: 'An accented name — the one accent in the Italian catalogue.',
    },
    { typed: 'giosue 1:9', expect: 'Josh.1.9', note: 'And the same typed without it.' },
    {
      typed: 'Giona 2:1',
      expect: 'Jonah.2.1',
      note: 'Nine books begin with Gio- or Giu-; this pins the one whose abbreviation is its name.',
    },
    { typed: 'Giobbe 1:1', expect: 'Job.1.1', note: 'Another of them.' },
    { typed: 'Giudici 6:12', expect: 'Judg.6.12', note: 'And another.' },
    { typed: 'Giuda 1:3', expect: 'Jude.1.3', note: 'And the shortest of them.' },
    { typed: 'Gioele 2:28', expect: 'Joel.2.28', note: 'And the last.' },
    { typed: '1 Corinzi 13', expect: '1Cor.13', note: 'A numbered book, written with a space.' },
    { typed: '1cor13', expect: '1Cor.13', note: 'The same with nothing between any of it.' },
    { typed: 'Atti 2:42', expect: 'Acts.2.42', note: 'A short name that is also a common word.' },
    { typed: 'Apocalisse 22:21', expect: 'Rev.22.21', note: 'The last verse of the Bible.' },
    { typed: 'Abacucco 1', expect: 'unknown', note: 'A misspelling is not quietly corrected.' },
  ],
  es: [
    { typed: 'Jn 3:16', expect: 'John.3.16', note: 'The plain case: the usual abbreviation.' },
    { typed: 'Juan 3:16', expect: 'John.3.16', note: 'And the full name.' },
    {
      typed: 'Génesis 1:1',
      expect: 'Gen.1.1',
      note: 'An accented name, written properly.',
    },
    { typed: 'genesis 1:1', expect: 'Gen.1.1', note: 'And the same typed without the accent.' },
    { typed: 'Éxodo 3:14', expect: 'Exod.3.14', note: 'An accent on the first letter.' },
    { typed: 'exodo 3:14', expect: 'Exod.3.14', note: 'And without it.' },
    { typed: 'Sal 23', expect: 'Ps.23', note: 'A whole chapter, with no verse.' },
    {
      typed: 'Nahúm 1:7',
      expect: 'Nah.1.7',
      note: 'Folding strips the accent, so nahum must reach exactly one book.',
    },
    { typed: 'nahum 1:7', expect: 'Nah.1.7', note: 'And it does.' },
    {
      typed: 'Jonás 2:1',
      expect: 'Jonah.2.1',
      note: 'Seven books begin with J; this is the one an accent would otherwise hide.',
    },
    { typed: 'jonas 2:1', expect: 'Jonah.2.1', note: 'Typed without the accent.' },
    { typed: 'Josué 1:9', expect: 'Josh.1.9', note: 'Another of the seven.' },
    { typed: 'josue 1:9', expect: 'Josh.1.9', note: 'And without its accent.' },
    { typed: 'Jueces 6:12', expect: 'Judg.6.12', note: 'And another.' },
    { typed: 'Job 1:1', expect: 'Job.1.1', note: 'Job is a whole name in Spanish, not an accent.' },
    { typed: 'Joel 2:28', expect: 'Joel.2.28', note: 'And another still.' },
    { typed: 'Judas 1:3', expect: 'Jude.1.3', note: 'And the last of them.' },
    { typed: 'Isaías 53:5', expect: 'Isa.53.5', note: 'An accented prophet.' },
    { typed: 'isaias 53:5', expect: 'Isa.53.5', note: 'And without it.' },
    { typed: 'Gálatas 2:20', expect: 'Gal.2.20', note: 'An accented epistle.' },
    { typed: 'galatas 2:20', expect: 'Gal.2.20', note: 'And without it.' },
    { typed: '1 Corintios 13', expect: '1Cor.13', note: 'A numbered book, written with a space.' },
    { typed: '1co13', expect: '1Cor.13', note: 'The same with nothing between any of it.' },
    {
      typed: 'Santiago 1:1',
      expect: 'Jas.1.1',
      note: 'A name that shares nothing with the English.',
    },
    { typed: 'Hechos 2:42', expect: 'Acts.2.42', note: 'Another one.' },
    { typed: 'Apocalipsis 22:21', expect: 'Rev.22.21', note: 'The last verse of the Bible.' },
    { typed: 'Habbacuc 1', expect: 'unknown', note: 'A misspelling is not quietly corrected.' },

    // Every accented name and abbreviation, typed the way a phone keyboard produces it. One row
    // per folded spelling, because folding is the only reason the plain form reaches a book.
    { typed: 'ex 3:14', expect: 'Exod.3.14', note: 'Éx, typed without its accent.' },
    { typed: 'levitico 1:1', expect: 'Lev.1.1', note: 'Levítico, typed without its accent.' },
    { typed: 'numeros 6:24', expect: 'Num.6.24', note: 'Números, typed without its accent.' },
    { typed: '1cronicas 16:11', expect: '1Chr.16.11', note: '1 Crónicas, without its accent.' },
    { typed: '2cronicas 7:14', expect: '2Chr.7.14', note: '2 Crónicas, without its accent.' },
    { typed: 'nehemias 8:10', expect: 'Neh.8.10', note: 'Nehemías, typed without its accent.' },
    { typed: 'eclesiastes 3:1', expect: 'Eccl.3.1', note: 'Eclesiastés, without its accent.' },
    { typed: 'jeremias 29:11', expect: 'Jer.29.11', note: 'Jeremías, typed without its accent.' },
    { typed: 'amos 5:24', expect: 'Amos.5.24', note: 'Amós, typed without its accent.' },
    { typed: 'abdias 1:15', expect: 'Obad.1.15', note: 'Abdías, typed without its accent.' },
    { typed: 'sofonias 3:17', expect: 'Zeph.3.17', note: 'Sofonías, typed without its accent.' },
    { typed: 'zacarias 4:6', expect: 'Zech.4.6', note: 'Zacarías, typed without its accent.' },
    { typed: 'malaquias 3:10', expect: 'Mal.3.10', note: 'Malaquías, typed without its accent.' },
    { typed: 'ga 2:20', expect: 'Gal.2.20', note: 'Gá, typed without its accent.' },
    { typed: 'filemon 1:6', expect: 'Phlm.1.6', note: 'Filemón, typed without its accent.' },
  ],
  uk: [
    // Ukrainian folds further than most: `ї` becomes `і` and `й` becomes `и`, so three of the
    // twelve minor prophets come within one fold of each other and every name carrying either
    // letter needs its folded spelling pinned to a book.
    { typed: 'Івана 3:16', expect: 'John.3.16', note: 'The plain case: a full name and a verse.' },
    { typed: 'Ів 3:16', expect: 'John.3.16', note: 'The abbreviation a reader actually types.' },
    { typed: 'Буття 1:1', expect: 'Gen.1.1', note: 'The first verse, by its full name.' },
    { typed: 'Бут 1:1', expect: 'Gen.1.1', note: 'And by its abbreviation.' },
    { typed: 'Пс 23', expect: 'Ps.23', note: 'A whole chapter, with no verse.' },
    { typed: 'Псалом 23', expect: 'Ps.23', note: 'The name used when citing one psalm.' },
    {
      typed: 'Йов 1:1',
      expect: 'Job.1.1',
      note: 'Йов, Йона and Йоіл all begin with the same two letters and all fold `й` to `и`. This pins the shortest of the three.',
    },
    { typed: 'Йона 1:1', expect: 'Jonah.1.1', note: 'The second of the three.' },
    { typed: 'Йоіл 1:1', expect: 'Joel.1.1', note: 'And the third.' },
    { typed: '1 Кор 13', expect: '1Cor.13', note: 'A numbered book, written with a space.' },
    { typed: '1кор13', expect: '1Cor.13', note: 'The same with nothing between any of it.' },
    { typed: 'Об’явлення 22:21', expect: 'Rev.22.21', note: 'The last verse of the Bible.' },
    { typed: 'Матвія 5:9', expect: 'Matt.5.9', note: 'A gospel by its full name.' },
    {
      typed: 'Єзекіїль 1:1',
      expect: 'Ezek.1.1',
      note: 'A name carrying ї, which folding changes.',
    },
    { typed: 'Євреїв 11:1', expect: 'Heb.11.1', note: 'Another, in the New Testament.' },
    { typed: 'Повторення Закону 6:4', expect: 'Deut.6.4', note: 'A two-word name with a space.' },
    {
      typed: 'Ісус Навин 1:9',
      expect: 'Josh.1.9',
      note: 'Another, which is also a person’s name.',
    },
    { typed: 'Авакум 2:4', expect: 'Hab.2.4', note: 'A minor prophet spelled unlike the English.' },
    { typed: 'Приповісті 3:5', expect: 'Prov.3.5', note: 'A name sharing nothing with Proverbs.' },
    {
      typed: 'Аввакум 1',
      expect: 'Hab.1',
      note: 'The Russian spelling, accepted as an alias: a reader raised on a Russian Bible types it, and turning them away teaches them nothing. Авакум is what the app prints.',
    },

    // The names other Ukrainian traditions print, and the genitive forms a prophet is usually
    // cited in. Ohienko is what the app shows; none of these would find anything without an
    // alias, and all of them are what somebody will type first.
    { typed: 'Суддів 6:12', expect: 'Judg.6.12', note: 'How Judges is actually cited.' },
    {
      typed: 'Апокаліпсис 22:21',
      expect: 'Rev.22.21',
      note: 'The name most readers know Revelation by.',
    },
    { typed: 'Псалтир 23', expect: 'Ps.23', note: 'The other common name for the Psalms.' },
    {
      typed: 'Притчі 3:5',
      expect: 'Prov.3.5',
      note: 'Khomenko and Turkonyak print Притчі, not Приповісті.',
    },
    {
      typed: 'Второзаконня 6:4',
      expect: 'Deut.6.4',
      note: 'The name other Ukrainian Bibles print.',
    },
    { typed: 'Еклезіаст 1:2', expect: 'Eccl.1.2', note: 'The commoner spelling of Екклезіяст.' },
    { typed: 'Діяння 1:8', expect: 'Acts.1.8', note: 'The fuller name for Acts.' },
    {
      typed: 'Ісаї 53:5',
      expect: 'Isa.53.5',
      note: 'The genitive, which is how a prophet is cited.',
    },
    { typed: 'Єремії 29:11', expect: 'Jer.29.11', note: 'And another.' },
    { typed: 'Осії 6:6', expect: 'Hos.6.6', note: 'And another.' },
    { typed: 'Даниїла 3:17', expect: 'Dan.3.17', note: 'And another.' },
    { typed: 'Авдій 1:1', expect: 'Obad.1.1', note: 'The non-Ohienko spelling of Obadiah.' },
    { typed: 'Аггей 1:1', expect: 'Hag.1.1', note: 'The non-Ohienko spelling of Haggai.' },
    {
      typed: 'Йоан 3:16',
      expect: 'John.3.16',
      note: 'Khomenko writes Йоан where Ohienko writes Іван.',
    },
    { typed: 'Матей 5:9', expect: 'Matt.5.9', note: 'And Матей where Ohienko writes Матвій.' },
    {
      typed: '1 Фес 4:16',
      expect: '1Thess.4.16',
      note: 'Фессалонікійців, abbreviated the way most readers learned it.',
    },

    // Every name carrying `ї` or `й`, typed the way a keyboard without them produces it. The
    // gate requires one of these per folded spelling: folding is the only reason the plain form
    // reaches a book at all, and which book it reaches has to be somebody's decision.
    { typed: 'иов 1:1', expect: 'Job.1.1', note: 'Йов, typed with и for й.' },
    { typed: 'иона 1:1', expect: 'Jonah.1.1', note: 'Йона, typed with и for й.' },
    { typed: 'иоіл 1:1', expect: 'Joel.1.1', note: 'Йоіл, typed with и for й.' },
    { typed: 'михеи 5:2', expect: 'Mic.5.2', note: 'Михей, typed with и for й.' },
    { typed: 'овдіи 1:1', expect: 'Obad.1.1', note: 'Овдій, typed with и for й.' },
    { typed: 'огіи 1:1', expect: 'Hag.1.1', note: 'Огій, typed with и for й.' },
    { typed: 'даниіл 1:1', expect: 'Dan.1.1', note: 'Даниїл, typed with і for ї.' },
    { typed: 'діі 1:8', expect: 'Acts.1.8', note: 'Дії, typed with і for ї.' },
    { typed: 'малахіі 4:2', expect: 'Mal.4.2', note: 'Малахії, typed with і for ї.' },
    { typed: 'євреів 11:1', expect: 'Heb.11.1', note: 'Євреїв, typed with і for ї.' },
    { typed: 'єзекііль 1:1', expect: 'Ezek.1.1', note: 'Єзекіїль, typed with і for ї.' },
    { typed: 'плач єреміі 3:22', expect: 'Lam.3.22', note: 'Плач Єремії, typed with і for ї.' },
    { typed: '1самуілова 1:1', expect: '1Sam.1.1', note: '1 Самуїлова, typed with і for ї.' },
    { typed: '2самуілова 1:1', expect: '2Sam.1.1', note: '2 Самуїлова, typed with і for ї.' },
  ],
  pl: [
    {
      typed: 'J 3:16',
      expect: 'John.3.16',
      note: 'The plain case: the siglum every Polish Bible prints.',
    },
    { typed: 'Jana 3:16', expect: 'John.3.16', note: 'The same by its name.' },
    { typed: 'Rdz 1:1', expect: 'Gen.1.1', note: 'The first verse, by its siglum.' },
    {
      typed: '1 Mojż 1:1',
      expect: 'Gen.1.1',
      note: 'And as a Protestant Bible, the Gdańska among them, cites it.',
    },
    { typed: 'Ps 23', expect: 'Ps.23', note: 'A whole chapter, with no verse.' },
    { typed: 'Psalm 23', expect: 'Ps.23', note: 'The name used when citing one psalm.' },
    { typed: '1 Kor 13', expect: '1Cor.13', note: 'A numbered book, written with a space.' },
    { typed: '1kor13', expect: '1Cor.13', note: 'The same with nothing between any of it.' },
    { typed: 'Ap 22:21', expect: 'Rev.22.21', note: 'The last verse of the Bible.' },
    {
      typed: 'Obj 22:21',
      expect: 'Rev.22.21',
      note: 'The same as Protestant Bibles cite it, by «Objawienie».',
    },
    {
      typed: 'Ez 37:1',
      expect: 'Ezek.37.1',
      note: 'Ez is Ezekiel in the Biblia Tysiąclecia; Ezra is Ezd. Both begin the same way.',
    },
    { typed: 'Ezd 1:1', expect: 'Ezra.1.1', note: 'And Ezra, one letter longer.' },
    { typed: 'Flp 4:13', expect: 'Phil.4.13', note: 'Philippians and Philemon share two letters.' },
    { typed: 'Flm 1:1', expect: 'Phlm.1.1', note: 'And Philemon.' },
    { typed: 'Jon 1:17', expect: 'Jonah.1.17', note: 'Jonah, not John: Jon is not short for Jan.' },
    {
      typed: 'Hi 1:1',
      expect: 'Job.1.1',
      note: 'Job is Hiob in Polish, with a siglum unlike the English.',
    },
    { typed: 'Łk 2:1', expect: 'Luke.2.1', note: 'A siglum carrying ł.' },
    { typed: 'lk 2:1', expect: 'Luke.2.1', note: 'The same typed without it, as on a phone.' },
    {
      typed: 'wyjscia 3:14',
      expect: 'Exod.3.14',
      note: 'Typed without Polish letters, as on a phone; no other book is near it.',
    },
    {
      typed: 'kaplanska 19:18',
      expect: 'Lev.19.18',
      note: 'Typed without Polish letters, as on a phone; no other book is near it.',
    },
    {
      typed: 'kpl 19:18',
      expect: 'Lev.19.18',
      note: 'Typed without Polish letters, as on a phone; no other book is near it.',
    },
    {
      typed: 'powtorzonego prawa 6:4',
      expect: 'Deut.6.4',
      note: 'Typed without Polish letters, as on a phone; no other book is near it.',
    },
    {
      typed: 'sedziow 6:12',
      expect: 'Judg.6.12',
      note: 'Typed without Polish letters, as on a phone; no other book is near it.',
    },
    {
      typed: '1 krolewska 19:12',
      expect: '1Kgs.19.12',
      note: 'Typed without Polish letters, as on a phone; no other book is near it.',
    },
    {
      typed: '2 krolewska 2:11',
      expect: '2Kgs.2.11',
      note: 'Typed without Polish letters, as on a phone; no other book is near it.',
    },
    {
      typed: 'przyslow 3:5',
      expect: 'Prov.3.5',
      note: 'Typed without Polish letters, as on a phone; no other book is near it.',
    },
    {
      typed: 'piesn nad piesniami 8:6',
      expect: 'Song.8.6',
      note: 'Typed without Polish letters, as on a phone; no other book is near it.',
    },
    {
      typed: 'lukasza 2:1',
      expect: 'Luke.2.1',
      note: 'Typed without Polish letters, as on a phone; no other book is near it.',
    },
    {
      typed: 'galatow 5:22',
      expect: 'Gal.5.22',
      note: 'Typed without Polish letters, as on a phone; no other book is near it.',
    },
    {
      typed: 'hebrajczykow 11:1',
      expect: 'Heb.11.1',
      note: 'Typed without Polish letters, as on a phone; no other book is near it.',
    },
  ],
};
