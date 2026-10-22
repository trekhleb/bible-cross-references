import type { Messages } from './types.ts';

// Slovenian distinguishes singular, dual, and two plural forms.
const form = (n: number, one: string, two: string, few: string, other: string): string => {
  const last = n % 100;
  return last === 1 ? one : last === 2 ? two : last === 3 || last === 4 ? few : other;
};

export const sl: Messages = {
  'attribution.chr1914-sl':
    'Slovensko besedilo: Chráska 1914, vir v javni domeni digitalizirala dLib.si. Napake OCR popravljene za to aplikacijo.',
  'app.name': 'Navzkrižne reference Svetega pisma',
  'app.name.short': 'Svetopisemske povezave',
  'view.arcs': 'Loki',
  'view.arcs.short': 'Loki',
  'view.arcs.open': 'Prikaži v lokih',
  'view.threads': 'Niti',
  'view.threads.short': 'Niti',
  'view.threads.open': 'Preberi v sobesedilu',
  'view.switch': 'Prikazi',
  'search.label': 'Poišči svetopisemski odlomek',
  'search.placeholder': 'Pojdi na…  Jn 3:16, Ps 23',
  'reference.unreadable': 'Vnesite navedek, na primer »Jn 3:16« ali »Ps 23«.',
  'reference.or': ' ali ',
  'menu.filtersChanged': 'Filtri (spremenjeni)',
  'menu.filters': 'Filtri',
  'menu.filters.votes': 'Ocene skupnosti',
  'menu.filters.votes.all': 'Vse',
  'filter.allLinks': 'vse povezave',
  'filter.noDownvoted': 'negativno ocenjene povezave so skrite',
  'menu.filters.tip': 'Nasvet: tapnite zvrst v legendi, da jo skrijete ali prikažete.',
  'menu.filters.reset': 'Ponastavi filtre',
  'attribution.bsb': 'Svetopisemsko besedilo: Berean Standard Bible (BSB), predano v javno domeno.',
  'attribution.kjv':
    'Svetopisemsko besedilo: King James Version (Authorized Version), besedilo iz leta 1769. Javna domena v ZDA in večini sveta; v Združenem kraljestvu kraljevi patent pridržuje pravico tiskanja imetnikom patenta: Cambridge University Press, Oxford University Press in Collins.',
  'attribution.blivre':
    'Svetopisemsko besedilo: Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio in Marco Teles, februar 2018 (izdaja Textus Receptus), https://sites.google.com/site/biblialivre/. Spremembe: poenoteni presledki; nobena beseda ni bila spremenjena.',
  'attribution.luther1912':
    'Svetopisemsko besedilo: Lutherbibel 1912 (LUT), revizija nemškega prevoda Martina Lutra iz leta 1912. Javna domena. Spremembe: odstranjene izvorne številke iz 358 vrstic in poškodovan zapis iz Sodnikov 11:25; nobena beseda ni bila spremenjena.',
  'attribution.riveduta1927':
    'Svetopisemsko besedilo: Riveduta 1927 (RIV), italijanska revizija pod vodstvom Giovannija Luzzija. Javna domena. Spremembe: odstranjene izvorne številke iz 228 vrstic, tekoče glave iz treh vrstic in odvečen znak iz 2. Samuelove 20:26; nobena beseda ni bila spremenjena.',
  'attribution.vbl':
    'Svetopisemsko besedilo: Versión Biblia Libre (VBL), © 2018–2020 Jonathan Gallagher in Shelly Barrios de Avila, z Gustavom Sanabrio in Rebekah Põldaas, https://ebible.org/Scriptures/details.php?id=spavbl, licenca CC BY-SA 4.0. Spremembe: premaknjen presledek pred dvopičjem v eni vrstici; nobena beseda ni bila spremenjena.',
  'license.publicDomain': 'Javna domena',
  'menu.translation': 'Prevod',
  'menu.language': 'Jezik',
  'genres.label': 'Zvrsti',
  'genres.labelChanged': 'Zvrsti (spremenjene)',
  'genres.show': 'Prikaži zvrsti',
  'genres.hide': 'Skrij zvrsti',
  'testament.OT': 'Stara zaveza',
  'testament.NT': 'Nova zaveza',
  'stats.label': 'Povzetek',
  'hint.zoom': 'za povečavo',
  'hint.pan': 'za premikanje',
  'hint.focus': 'za izbor',
  'hint.hold': 'pridržite za predogled',
  'panel.details': 'Podrobnosti',
  'panel.expand': 'Razširi podrobnosti',
  'panel.collapse': 'Skrči podrobnosti',
  'panel.close': 'Zapri',
  'panel.previousVerse': 'Prejšnja vrstica',
  'panel.nextVerse': 'Naslednja vrstica',
  'panel.previousChapter': 'Prejšnje poglavje',
  'panel.nextChapter': 'Naslednje poglavje',
  'panel.copy.title': 'Kopiraj s povezavo',
  'panel.connectsTo': 'Povezano z',
  'panel.references': 'Sklici',
  'panel.references.note': 'odlomki, na katere se sklicuje ta odlomek',
  'panel.referencedBy': 'Nanj se sklicujejo',
  'panel.referencedBy.note': 'odlomki, ki se sklicujejo na ta odlomek',
  'panel.verses': 'Vrstice',
  'panel.verses.note': 'tapnite vrstico za prikaz',
  'panel.none': 'Ni povezav',
  'words.note': 'kje drugje se pojavi',
  'language.hebrew': 'hebrejska',
  'language.greek': 'grška',
  'words.creditLabel': 'Besede:',
  'error.datasetUnavailable':
    'Tega dela svetopisemskih podatkov ni mogoče naložiti. Preverite povezavo in poskusite znova.',
  'error.retry': 'Poskusi znova',
  'threads.direction': 'Smer povezav',
  'threads.outgoing': 'Se sklicuje na',
  'threads.incoming': 'Nanj se sklicuje',
  'threads.both': 'Oboje',
  'threads.chapters': 'Poglavja',
  'threads.previousChapter': 'Prejšnje poglavje',
  'threads.nextChapter': 'Naslednje poglavje',
  'threads.stage':
    'Povezave od vrstic tega poglavja do drugih svetopisemskih odlomkov, prikazanih na navpičnem traku vseh 66 knjig.',
  'arcs.stage':
    'Ločni prikaz navzkrižnih referenc. Povlecite ali uporabite smerne tipke za premikanje, kolešček ali +/− za povečavo in klik za izbor odlomka. Escape počisti izbor. Na zaslonu na dotik pridržite za predogled odlomka.',
  'credits.links': 'Povezave:',
  'credits.fromTsk': ', iz zbirke Treasury of Scripture Knowledge',
  'credits.reindexed': ', prerazporejeno',
  'credits.toKjv': ' po številčenju vrstic KJV',
  'credits.text': 'Besedilo:',
  'credits.inspiredBy': 'Navdih',
  'footer.source': 'Izvorna koda na GitHubu',
  'footer.sourceLabel': 'GitHub',
  'install.link': 'Namestite aplikacijo',
  'install.linkLabel': 'Namesti',
  'install.title': 'Namestite aplikacijo',
  'install.lede':
    'Dodajte jo na začetni zaslon in berite brez povezave. Brez trgovine z aplikacijami in brez računa.',
  'install.now': 'Namesti zdaj',
  'install.device': 'Naprava',
  'install.close': 'Zapri',
  'install.whileOnline':
    'Aplikacijo enkrat odprite med povezavo z internetom: takrat se svetopisemsko besedilo in navzkrižne reference shranijo v vašo napravo.',

  'reference.unknownBook': (query) => `Neznana knjiga »${query}«.`,
  'reference.ambiguous': (query, candidates) => `»${query}« lahko pomeni ${candidates}.`,
  'reference.chapters': (book, count, plural) =>
    `${book} ima ${count} ${form(plural, 'poglavje', 'poglavji', 'poglavja', 'poglavij')}.`,
  'reference.verses': (reference, chapter, count, plural) =>
    `${reference} ${chapter} ima ${count} ${form(plural, 'vrstico', 'vrstici', 'vrstice', 'vrstic')}.`,
  'menu.filters.votes.atLeast': (votes) => `≥ ${String(votes)}`,
  'menu.filters.note': (shown, total, threshold, hidden) =>
    `Glasovi razvrščajo povezave po uporabnosti za bralce OpenBible.info; ne dokazujejo njihove pravilnosti. Prikazanih je ${shown} od ${total} povezav (${threshold}${hidden}).`,
  'menu.filters.hiddenGenres': (count) =>
    `, ${String(count)} ${form(count, 'skrita zvrst', 'skriti zvrsti', 'skrite zvrsti', 'skritih zvrsti')}`,
  'filter.atLeastVotes': (votes, plural) =>
    `≥ ${votes} ${form(plural, 'glas', 'glasova', 'glasovi', 'glasov')}`,
  'menu.translation.failed': (name) => `Prevoda ${name} ni bilo mogoče naložiti.`,
  'menu.translation.error': (message) => `${message} Preverite povezavo in poskusite znova.`,
  'genres.hideOne': (name) => `Skrij: ${name}`,
  'genres.showOne': (name) => `Prikaži: ${name}`,
  'stats.verses': (count, plural) => [
    { strong: count },
    ` ${form(plural, 'vrstica', 'vrstici', 'vrstice', 'vrstic')}`,
  ],
  'stats.links': (shown, total, plural) => [
    { strong: shown },
    ` ${total === null ? '' : `od ${total} `}${form(plural, 'povezava', 'povezavi', 'povezave', 'povezav')} na prikazu`,
  ],
  'stats.connected': (share) => [{ strong: share }, ' povezanih vrstic'],
  'stats.crossTestament': (count, plural) => [
    { strong: count },
    ` ${form(plural, 'povezava', 'povezavi', 'povezave', 'povezav')} med zavezama`,
  ],
  'panel.copy': (reference) => `Kopiraj ${reference} s povezavo`,
  'panel.copied': (reference) => `${reference} kopirano`,
  'panel.omitted': (abbreviation) => `Izpuščeno v prevodu ${abbreviation}.`,
  'panel.moreVerses': (count, plural) =>
    `+ ${count} ${form(plural, 'dodatna vrstica', 'dodatni vrstici', 'dodatne vrstice', 'dodatnih vrstic')}`,
  'panel.showAll': (count) => `Prikaži vse (${count})`,
  'note.toRange': (range) => `do ${range}`,
  'note.fromVerse': (verse) => `od vrstice ${verse}`,
  'note.toVerse': (verse) => `do vrstice ${verse}`,
  'panel.connectsTo.note': (count) =>
    `${String(count)} ${form(count, 'zvrst', 'zvrsti', 'zvrsti', 'zvrsti')}`,
  'panel.items': (plural) => form(plural, 'postavka', 'postavki', 'postavke', 'postavk'),
  'panel.passages': (plural) => form(plural, 'odlomek', 'odlomka', 'odlomki', 'odlomkov'),
  'panel.linksCounted': (plural) => form(plural, 'povezava', 'povezavi', 'povezave', 'povezav'),
  'panel.versesCounted': (plural) => form(plural, 'vrstica', 'vrstici', 'vrstice', 'vrstic'),
  'words.heading': (language) => `Ista ${language} beseda`,
  'words.counted': (plural) => form(plural, 'beseda', 'besedi', 'besede', 'besed'),
  'words.showMore': (count) => `Prikaži še ${count}`,
  'words.credit': (max) =>
    `, na podlagi dela ustanove Tyndale House v Cambridgeu; združeno po slovarskih oblikah. Besede v več kot ${max} vrsticah so izpuščene.`,
  'loading.data': (verses, links) => `Nalaganje ${verses} vrstic in ${links} navzkrižnih referenc…`,
  'error.viewFailed': (view, message) => `Prikaza ${view} ni mogoče zagnati: ${message}`,
  'threads.verse': (number) => `Vrstica ${number}: prikaži povezave`,
  'threads.omitted': (abbreviation) =>
    `Izpuščeno v prevodu ${abbreviation} (ni v najstarejših rokopisih).`,
  'threads.spineHover': (count, plural) =>
    `${count} ${form(plural, 'nit', 'niti', 'niti', 'niti')} od tu · kliknite za branje`,
  'arcs.connections': (count, plural) =>
    `${count} ${form(plural, 'povezava', 'povezavi', 'povezave', 'povezav')}`,
  'credits.inspiration': (title, author) => `${title}, avtor: ${author}`,
};
