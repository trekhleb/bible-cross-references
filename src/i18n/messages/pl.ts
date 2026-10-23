import type { LocaleMessages } from './types.ts';
import type { Emphasized } from './types.ts';

/**
 * Polish counts in three forms: 1 werset, 2 wersety, 5 wersetów. It differs from Ukrainian in
 * one place worth writing down: only 1 itself takes the singular, so 21 is «21 wersetów», not
 * «21 werset». The teens (12–14) take the third form, as they do in every Slavic language.
 */
export function formOf(count: number, one: string, few: string, many: string): string {
  const absolute = Math.abs(count);
  const lastDigit = absolute % 10;
  const lastTwo = absolute % 100;
  if (absolute === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) {
    return few;
  }
  return many;
}

/** The interface in Polish. Anything left out falls back to the English word. */
export const pl: LocaleMessages = {
  'app.name': 'Odnośniki biblijne',
  'app.name.short': 'Odnośniki',

  'view.arcs': 'Łuki',
  'view.arcs.short': 'Łuki',
  'view.arcs.open': 'Pokaż na łukach',
  // Named for what the reader is looking at — one chapter at a time — as the Ukrainian is:
  // «Nici» would be sewing thread and carry none of the English metaphor.
  'view.threads': 'Rozdziały',
  'view.threads.short': 'Rozdziały',
  'view.threads.open': 'Czytaj w kontekście',
  'view.switch': 'Wizualizacje',

  'search.label': 'Przejdź do miejsca w Biblii',
  'search.placeholder': 'Przejdź do…  J 3:16, Ps 23',

  'reference.unreadable': 'Wpisz odnośnik, np. „J 3:16” albo „Ps 23”.',
  'reference.unknownBook': (query) => `Nieznana księga „${query}”.`,
  'reference.ambiguous': (query, candidates) => `„${query}” może oznaczać: ${candidates}.`,
  'reference.or': ' albo ',
  // No verb: «Psalmy» would want «mają» and «Rut» «ma». A colon sidesteps an agreement the app
  // cannot know, and reads as naturally.
  'reference.chapters': (book, count, plural) =>
    `${book}: ${count} ${formOf(plural, 'rozdział', 'rozdziały', 'rozdziałów')}.`,
  'reference.verses': (reference, chapter, count, plural) =>
    `${reference} ${chapter}: ${count} ${formOf(plural, 'werset', 'wersety', 'wersetów')}.`,

  'menu.filtersChanged': 'Filtry (zmienione)',
  'menu.filters': 'Filtry',
  'menu.filters.votes': 'Głosy społeczności',
  'menu.filters.votes.all': 'Wszystkie',
  'menu.filters.votes.atLeast': (votes) => `≥ ${String(votes)}`,
  'menu.filters.note': (shown, total, threshold, hidden) =>
    `Głosy pokazują, jak przydatny wydał się odnośnik czytelnikom OpenBible.info; nie ` +
    `dowodzą, że jest trafny ani że jest błędny. Pokazano ${shown} z ${total} odnośników ` +
    `(${threshold}${hidden}).`,
  'menu.filters.hiddenGenres': (count) =>
    `, ukryto ${String(count)} ${formOf(count, 'gatunek', 'gatunki', 'gatunków')}`,
  'filter.allLinks': 'wszystkie odnośniki',
  'filter.noDownvoted': 'bez odnośników ocenionych negatywnie',
  'filter.atLeastVotes': (votes, count) => `≥ ${votes} ${formOf(count, 'głos', 'głosy', 'głosów')}`,
  'menu.filters.tip': 'Wskazówka: stuknij gatunek w legendzie, aby go ukryć lub pokazać.',
  'menu.filters.reset': 'Wyczyść filtry',

  'attribution.bsb': 'Tekst Biblii: Berean Standard Bible (BSB), przekazana do domeny publicznej.',
  'attribution.kjv':
    'Tekst Biblii: King James Version (Authorized Version), tekst z 1769 roku. Domena ' +
    'publiczna w Stanach Zjednoczonych i w większości krajów; w Wielkiej Brytanii patent ' +
    'królewski zastrzega prawo druku dla drukarzy Korony — Cambridge University Press, Oxford ' +
    'University Press i Collins.',
  'attribution.blivre':
    'Tekst Biblii: Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio i Marco Teles, ' +
    'luty 2018 (wydanie Textus Receptus), https://sites.google.com/site/biblialivre/. ' +
    'Zmiany: ujednolicono odstępy; żadnego słowa nie zmieniono.',
  'attribution.luther1912':
    'Tekst Biblii: Lutherbibel 1912 (LUT), rewizja z 1912 roku niemieckiego przekładu ' +
    'Marcina Lutra. Domena publiczna. Zmiany: z 358 wersetów usunięto numery wersetów tego ' +
    'wydania, a z Sędziów 11:25 uszkodzony fragment; żadnego słowa nie zmieniono.',
  'attribution.riveduta1927':
    'Tekst Biblii: Riveduta 1927 (RIV), włoska rewizja przygotowana pod kierunkiem ' +
    'Giovanniego Luzziego. Domena publiczna. Zmiany: z 228 wersetów usunięto numery wersetów ' +
    'tego wydania, z trzech kolejnych pagina, a z 2 Samuela 20:26 przypadkowy znak; żadnego ' +
    'słowa nie zmieniono.',
  'attribution.vbl':
    'Tekst Biblii: Versión Biblia Libre (VBL), © 2018–2020 Jonathan Gallagher i Shelly ' +
    'Barrios de Avila, przy współpracy Gustavo Sanabrii i Rebekah Põldaas, ' +
    'https://ebible.org/Scriptures/details.php?id=spavbl, na licencji CC BY-SA 4.0. ' +
    'Zmiany: w jednym wersecie przesunięto spację przed dwukropkiem; żadnego słowa nie ' +
    'zmieniono.',
  'license.publicDomain': 'Domena publiczna',
  'menu.translation': 'Przekład',
  'menu.translation.failed': (name) => `Nie udało się wczytać: ${name}.`,
  'menu.translation.error': (message) => `${message} Sprawdź połączenie i spróbuj ponownie.`,
  'menu.language': 'Język',

  'genres.label': 'Gatunki',
  'genres.labelChanged': 'Gatunki (zmienione)',
  'genres.show': 'Pokaż gatunki',
  'genres.hide': 'Ukryj gatunki',
  // Quoted, so the genre name can stay in the nominative rather than an accusative the app
  // would have to inflect for each of the ten.
  'genres.hideOne': (name) => `Ukryj „${name}”`,
  'genres.showOne': (name) => `Pokaż „${name}”`,
  'testament.OT': 'Stary Testament',
  'testament.NT': 'Nowy Testament',

  'stats.label': 'Podsumowanie',
  'stats.verses': (count, plural): Emphasized => [
    { strong: count },
    ` ${formOf(plural, 'werset', 'wersety', 'wersetów')}`,
  ],
  'stats.links': (shown, total, plural): Emphasized => {
    const links = formOf(plural, 'odnośnik', 'odnośniki', 'odnośników');
    return total === null
      ? [{ strong: shown }, ` ${links} na widoku`]
      : [{ strong: shown }, ` z ${total} ${links} na widoku`];
  },
  'stats.connected': (share): Emphasized => [{ strong: share }, ' wersetów ma powiązania'],
  'stats.crossTestament': (count, plural): Emphasized => [
    { strong: count },
    ` ${formOf(plural, 'odnośnik', 'odnośniki', 'odnośników')} między Testamentami`,
  ],
  'hint.zoom': 'aby powiększyć',
  'hint.pan': 'aby przesunąć',
  'hint.focus': 'aby wybrać',
  'hint.hold': 'przytrzymaj, aby podejrzeć',

  'panel.details': 'Szczegóły',
  'panel.expand': 'Rozwiń szczegóły',
  'panel.collapse': 'Zwiń szczegóły',
  'panel.close': 'Zamknij',
  'panel.previousVerse': 'Poprzedni werset',
  'panel.nextVerse': 'Następny werset',
  'panel.previousChapter': 'Poprzedni rozdział',
  'panel.nextChapter': 'Następny rozdział',
  'panel.copy': (reference) => `Kopiuj ${reference} z linkiem`,
  'panel.copy.title': 'Kopiuj z linkiem',
  'panel.copied': (reference) => `Skopiowano ${reference}`,
  'panel.omitted': (abbreviation) => `Pominięty w ${abbreviation}.`,
  'panel.moreVerses': (count, plural) =>
    `+ jeszcze ${count} ${formOf(plural, 'werset', 'wersety', 'wersetów')}`,
  'panel.showAll': (count) => `Pokaż wszystkie (${count})`,

  'note.toRange': (range) => `do ${range}`,
  'note.fromVerse': (verse) => `od w. ${verse}`,
  'note.toVerse': (verse) => `do w. ${verse}`,

  'panel.connectsTo': 'Powiązania z',
  'panel.connectsTo.note': (count) =>
    `${String(count)} ${formOf(count, 'gatunek', 'gatunki', 'gatunków')}`,
  'panel.references': 'Odsyła do',
  'panel.references.note': 'dokąd prowadzi ten fragment',
  'panel.referencedBy': 'Odsyłają tutaj',
  'panel.referencedBy.note': 'fragmenty, które tu prowadzą',
  'panel.verses': 'Wersety',
  'panel.verses.note': 'stuknij werset, aby go wybrać',
  'panel.none': 'Brak',
  'panel.items': (plural) => formOf(plural, 'pozycja', 'pozycje', 'pozycji'),
  'panel.passages': (plural) => formOf(plural, 'fragment', 'fragmenty', 'fragmentów'),
  'panel.linksCounted': (plural) => formOf(plural, 'odnośnik', 'odnośniki', 'odnośników'),
  'panel.versesCounted': (plural) => formOf(plural, 'werset', 'wersety', 'wersetów'),

  'words.heading': (language) => `To samo słowo ${language}`,
  'words.note': 'gdzie jeszcze występuje',
  'words.counted': (plural) => formOf(plural, 'słowo', 'słowa', 'słów'),
  'words.showMore': (count) => `Pokaż jeszcze ${count}`,
  'language.hebrew': 'hebrajskie',
  'language.greek': 'greckie',
  'words.credit': (max) =>
    `, na podstawie pracy Tyndale House w Cambridge; sprowadzone do form słownikowych. Słowa ` +
    `występujące w więcej niż ${max} wersetach pominięto.`,
  'words.creditLabel': 'Słowa:',

  'loading.data': (verses, links) => `Wczytywanie ${verses} wersetów i ${links} odnośników…`,
  'error.datasetUnavailable':
    'Nie udało się wczytać tej części danych biblijnych. Sprawdź połączenie i spróbuj ponownie.',
  'error.retry': 'Spróbuj ponownie',
  'error.viewFailed': (view, message) => `Nie udało się uruchomić widoku ${view}: ${message}`,

  'threads.direction': 'Kierunek odnośników',
  // Each option says what it selects on its own: a screen reader announces the option, not the
  // heading above it.
  'threads.outgoing': 'Z wersetu',
  'threads.incoming': 'Do wersetu',
  'threads.both': 'Oba',
  'threads.verse': (number) => `Werset ${number}: pokaż jego powiązania`,
  'threads.omitted': (abbreviation) =>
    `Pominięty w ${abbreviation} (brak w najstarszych rękopisach).`,
  'threads.spineHover': (count, plural) =>
    `${count} ${formOf(plural, 'odnośnik', 'odnośniki', 'odnośników')} stąd · kliknij, aby czytać`,
  'threads.chapters': 'Rozdziały',
  'threads.previousChapter': 'Poprzedni rozdział',
  'threads.nextChapter': 'Następny rozdział',
  'threads.stage':
    'Linie od wersetów tego rozdziału do miejsc w Biblii, do których prowadzą ich odnośniki; ' +
    'Biblia jest pokazana jako pionowy pasek wszystkich 66 ksiąg.',
  'arcs.connections': (count, plural) =>
    `${count} ${formOf(plural, 'powiązanie', 'powiązania', 'powiązań')}`,
  'arcs.stage':
    'Wykres łuków odnośników. Przeciągaj lub używaj strzałek, aby przesuwać wykres, przewijaj ' +
    'lub naciskaj +/-, aby powiększać, kliknij, aby wybrać fragment, Escape, aby wyczyścić. Na ' +
    'ekranie dotykowym przytrzymaj palec, aby podejrzeć fragment.',

  'credits.links': 'Odnośniki:',
  'credits.fromTsk': ', z Treasury of Scripture Knowledge',
  'credits.reindexed': ', przeindeksowane',
  'credits.toKjv': ' do numeracji wersetów KJV',
  'credits.text': 'Tekst:',
  'credits.inspiredBy': 'Inspiracja:',
  'credits.inspiration': (title, author) => `${title}, autor: ${author}`,

  'footer.source': 'Kod źródłowy na GitHubie',
  'footer.sourceLabel': 'GitHub',

  'install.link': 'Zainstaluj aplikację',
  'install.linkLabel': 'Zainstaluj',
  'install.title': 'Zainstaluj aplikację',
  'install.lede':
    'Miej ją na ekranie głównym i czytaj nawet bez internetu. Bez sklepu z aplikacjami, bez ' +
    'zakładania konta.',
  'install.now': 'Zainstaluj teraz',
  'install.device': 'Urządzenie',
  'install.close': 'Zamknij',
  'install.whileOnline':
    'Otwórz aplikację raz, gdy masz internet: wtedy zapisze tekst Biblii i odnośniki na ' +
    'Twoim urządzeniu.',
};
