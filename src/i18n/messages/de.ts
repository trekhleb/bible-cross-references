import type { Emphasized, LocaleMessages } from './types.ts';

/** The interface in German. Anything left out falls back to the English word. */
export const de: LocaleMessages = {
  'app.name': 'Bibel-Querverweise',
  'app.name.short': 'Querverweise',

  'view.arcs': 'Bögen',
  'view.arcs.short': 'Bögen',
  'view.arcs.open': 'In den Bögen zeigen',
  'view.threads': 'Fäden',
  'view.threads.short': 'Fäden',
  'view.threads.open': 'Im Zusammenhang lesen',
  'view.switch': 'Darstellungen',

  'search.label': 'Zu einer Bibelstelle springen',
  'search.placeholder': 'Springe zu…  Joh 3,16, Ps 23',

  'reference.unreadable': 'Geben Sie eine Stelle ein, etwa „Joh 3,16“ oder „Ps 23“.',
  'reference.unknownBook': (query) => `Unbekanntes Buch „${query}“.`,
  'reference.ambiguous': (query, candidates) => `„${query}“ kann ${candidates} sein.`,
  'reference.or': ' oder ',
  // `Kapitel` is the same word in the plural, so the numeral is the only thing that could
  // change — and German writes the smallest one out: „Obadja hat ein Kapitel.“
  'reference.chapters': (book, count, plural) =>
    plural === 1 ? `${book} hat ein Kapitel.` : `${book} hat ${count} Kapitel.`,
  'reference.verses': (reference, chapter, count, plural) =>
    plural === 1
      ? `${reference} ${chapter} hat ${count} Vers.`
      : `${reference} ${chapter} hat ${count} Verse.`,

  'menu.filtersChanged': 'Filter (geändert)',
  'menu.filters': 'Filter',
  'menu.filters.votes': 'Stimmen der Leser',
  'menu.filters.votes.all': 'Alle',
  'menu.filters.votes.atLeast': (votes) => `≥ ${String(votes)}`,
  'menu.filters.note': (shown, total, threshold, hidden) =>
    `Die Stimmen zeigen, wie hilfreich die Leser von OpenBible.info einen Verweis fanden; sie ` +
    `belegen nicht, ob er zutrifft. Angezeigt werden ${shown} von ${total} Verweisen ` +
    `(${threshold}${hidden}).`,
  'menu.filters.hiddenGenres': (count) =>
    count === 1 ? ', 1 Gattung ausgeblendet' : `, ${String(count)} Gattungen ausgeblendet`,
  'filter.allLinks': 'alle Verweise',
  'filter.noDownvoted': 'abgewertete Verweise ausgeblendet',
  'filter.atLeastVotes': (votes, plural) =>
    plural === 1 ? `≥ ${votes} Stimme` : `≥ ${votes} Stimmen`,
  'menu.filters.tip':
    'Tipp: Tippen Sie in der Legende auf eine Gattung, um sie aus- oder einzublenden.',
  'menu.filters.reset': 'Filter zurücksetzen',

  'attribution.bsb':
    'Bibeltext: Berean Standard Bible (BSB), von den Herausgebern gemeinfrei gestellt.',
  'attribution.kjv':
    'Bibeltext: King James Version (Authorized Version), Textfassung von 1769. Gemeinfrei in ' +
    'den Vereinigten Staaten und im größten Teil der Welt; im Vereinigten Königreich behält ein ' +
    'königliches Patent das Druckrecht den Druckern der Krone vor — Cambridge University Press, ' +
    'Oxford University Press und Collins.',
  'attribution.blivre':
    'Bibeltext: Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio und Marco Teles, Februar ' +
    '2018 (Ausgabe nach dem Textus Receptus), https://sites.google.com/site/biblialivre/. ' +
    'Geändert: Leerzeichen wurden vereinheitlicht; kein Wort wurde verändert.',
  'attribution.luther1912':
    'Bibeltext: Lutherbibel 1912 (LUT), die Revision von 1912 der Übersetzung Martin Luthers. ' +
    'Gemeinfrei. Geändert: Die Verszählung der Ausgabe selbst wurde aus 358 Versen entfernt und ' +
    'ein beschädigtes Bruchstück aus Richter 11,25; kein Wort wurde verändert.',
  'attribution.riveduta1927':
    'Bibeltext: Riveduta 1927 (RIV), die italienische Revision unter Giovanni Luzzi. ' +
    'Gemeinfrei. Geändert: Die Verszählung der Ausgabe selbst wurde aus 228 Versen entfernt, ' +
    'ein Kolumnentitel aus drei weiteren und ein verirrtes Zeichen aus 2. Samuel 20,26; kein ' +
    'Wort wurde verändert.',
  'attribution.vbl':
    'Bibeltext: Versión Biblia Libre (VBL), © 2018–2020 Jonathan Gallagher und Shelly Barrios ' +
    'de Avila, mit Gustavo Sanabria und Rebekah Põldaas, ' +
    'https://ebible.org/Scriptures/details.php?id=spavbl, lizenziert unter CC BY-SA 4.0. ' +
    'Geändert: In einem Vers wurde ein Leerzeichen vor einem Doppelpunkt verschoben; kein Wort ' +
    'wurde verändert.',
  'attribution.ubg':
    'Bibeltext: Uwspółcześniona Biblia Gdańska (UBG), © 2018 Fundacja Wrota Nadziei, https://ebible.org/Scriptures/details.php?id=polubg, lizenziert unter CC BY-ND 4.0. Kein Wort und kein Satzzeichen wurde verändert.',
  'license.publicDomain': 'Gemeinfrei',
  'menu.translation': 'Übersetzung',
  'menu.translation.failed': (name) => `${name} konnte nicht geladen werden.`,
  'menu.translation.error': (message) =>
    `${message} Prüfen Sie Ihre Verbindung und versuchen Sie es erneut.`,
  'menu.language': 'Sprache',

  'genres.label': 'Gattungen',
  'genres.labelChanged': 'Gattungen (geändert)',
  'genres.show': 'Gattungen einblenden',
  'genres.hide': 'Gattungen ausblenden',
  'genres.hideOne': (name) => `${name} ausblenden`,
  'genres.showOne': (name) => `${name} einblenden`,
  'testament.OT': 'Altes Testament',
  'testament.NT': 'Neues Testament',

  'stats.label': 'Übersicht',
  'stats.verses': (count, plural): Emphasized => [
    { strong: count },
    plural === 1 ? ' Vers' : ' Verse',
  ],
  'stats.links': (shown, total, plural): Emphasized =>
    total === null
      ? [{ strong: shown }, ` ${plural === 1 ? 'Verweis' : 'Verweise'} angezeigt`]
      : [{ strong: shown }, ` von ${total} ${plural === 1 ? 'Verweis' : 'Verweisen'} angezeigt`],
  'stats.connected': (share): Emphasized => [{ strong: share }, ' der Verse verknüpft'],
  'stats.crossTestament': (count, plural): Emphasized => [
    { strong: count },
    plural === 1 ? ' Verweis zwischen den Testamenten' : ' Verweise zwischen den Testamenten',
  ],
  'hint.zoom': 'zum Zoomen',
  'hint.pan': 'zum Verschieben',
  'hint.focus': 'zum Auswählen',
  'hint.hold': 'gedrückt halten für die Vorschau',

  'panel.details': 'Details',
  'panel.expand': 'Details aufklappen',
  'panel.collapse': 'Details zuklappen',
  'panel.close': 'Schließen',
  'panel.previousVerse': 'Vorheriger Vers',
  'panel.nextVerse': 'Nächster Vers',
  'panel.previousChapter': 'Vorheriges Kapitel',
  'panel.nextChapter': 'Nächstes Kapitel',
  'panel.copy': (reference) => `${reference} mit Link kopieren`,
  'panel.copy.title': 'Mit Link kopieren',
  'panel.copied': (reference) => `${reference} kopiert`,
  'panel.omitted': (abbreviation) => `In der ${abbreviation} nicht enthalten.`,
  'panel.moreVerses': (count, plural) =>
    plural === 1 ? `+ ${count} weiterer Vers` : `+ ${count} weitere Verse`,
  'panel.showAll': (count) => `Alle ${count} anzeigen`,

  'note.toRange': (range) => `bis ${range}`,
  'note.fromVerse': (verse) => `ab V. ${verse}`,
  'note.toVerse': (verse) => `bis V. ${verse}`,

  'panel.connectsTo': 'Verknüpft mit',
  'panel.connectsTo.note': (count) => (count === 1 ? '1 Gattung' : `${String(count)} Gattungen`),
  'panel.references': 'Verweist auf',
  'panel.references.note': 'wohin diese Stelle zeigt',
  'panel.referencedBy': 'Verweisen hierher',
  'panel.referencedBy.note': 'Stellen, die hierher zeigen',
  'panel.verses': 'Verse',
  'panel.verses.note': 'auf einen Vers tippen, um ihn auszuwählen',
  'panel.none': 'Keine',
  'panel.items': (plural) => (plural === 1 ? 'Eintrag' : 'Einträge'),
  'panel.passages': (plural) => (plural === 1 ? 'Stelle' : 'Stellen'),
  'panel.linksCounted': (plural) => (plural === 1 ? 'Verweis' : 'Verweise'),
  'panel.versesCounted': (plural) => (plural === 1 ? 'Vers' : 'Verse'),

  'words.heading': (language) => `Dasselbe ${language} Wort`,
  'words.note': 'wo es sonst vorkommt',
  'words.counted': (plural) => (plural === 1 ? 'Wort' : 'Wörter'),
  'words.showMore': (count) => `${count} weitere anzeigen`,
  'language.hebrew': 'hebräische',
  'language.greek': 'griechische',
  'words.credit': (max) =>
    `, auf Grundlage der Arbeit des Tyndale House, Cambridge; auf die Wörterbuchformen ` +
    `reduziert. Wörter, die in mehr als ${max} Versen vorkommen, bleiben außen vor.`,
  'words.creditLabel': 'Wörter:',

  'loading.data': (verses, links) => `${verses} Verse und ${links} Querverweise werden geladen…`,
  'error.datasetUnavailable':
    'Dieser Teil der Bibeldaten konnte nicht geladen werden. Prüfen Sie Ihre Verbindung und ' +
    'versuchen Sie es erneut.',
  'error.retry': 'Erneut versuchen',
  'error.viewFailed': (view, message) => `${view} konnte nicht starten: ${message}`,

  'threads.direction': 'Richtung der Fäden',
  'threads.outgoing': 'Von hier',
  'threads.incoming': 'Hierher',
  'threads.both': 'Beide',
  'threads.verse': (number) => `Vers ${number}: seine Verknüpfungen zeigen`,
  'threads.omitted': (abbreviation) =>
    `In der ${abbreviation} nicht enthalten (fehlt in den ältesten Handschriften).`,
  'threads.spineHover': (count, plural) =>
    plural === 1
      ? `${count} Faden von hier · zum Lesen klicken`
      : `${count} Fäden von hier · zum Lesen klicken`,
  'threads.chapters': 'Kapitel',
  'threads.previousChapter': 'Vorheriges Kapitel',
  'threads.nextChapter': 'Nächstes Kapitel',
  'threads.stage':
    'Fäden von den Versen dieses Kapitels zu den Stellen in der Bibel, auf die ihre ' +
    'Querverweise zeigen; die Bibel steht als senkrechter Balken aus allen 66 Büchern.',
  'arcs.connections': (count, plural) =>
    plural === 1 ? `${count} Verknüpfung` : `${count} Verknüpfungen`,
  'arcs.stage':
    'Bogendiagramm der Querverweise. Ziehen Sie oder nutzen Sie die Pfeiltasten zum ' +
    'Verschieben, scrollen Sie oder drücken Sie +/-, um zu zoomen, klicken Sie, um eine Stelle ' +
    'auszuwählen, Escape setzt zurück. Auf einem Touchscreen tippen und halten Sie für die ' +
    'Vorschau einer Stelle.',

  'credits.links': 'Verweise:',
  'credits.fromTsk': ', aus dem Treasury of Scripture Knowledge',
  'credits.reindexed': ', neu zugeordnet',
  'credits.toKjv': ' zur Verszählung der KJV',
  'credits.text': 'Text:',
  'credits.inspiredBy': 'Angeregt durch',
  'credits.inspiration': (title, author) => `${title}, von ${author}`,

  'footer.source': 'Quelltext auf GitHub',
  'footer.sourceLabel': 'GitHub',

  'install.link': 'App installieren',
  'install.linkLabel': 'Installieren',
  'install.title': 'App installieren',
  'install.lede':
    'Behalten Sie sie auf dem Startbildschirm und lesen Sie auch ohne Internet. Kein App-Store, ' +
    'kein Konto.',
  'install.now': 'Jetzt installieren',
  'install.device': 'Gerät',
  'install.close': 'Schließen',
  'install.whileOnline':
    'Öffnen Sie die App einmal, solange Sie online sind: Dann legt sie den Bibeltext und die ' +
    'Querverweise auf Ihrem Gerät ab.',
};
