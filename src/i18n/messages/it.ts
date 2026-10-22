import type { Emphasized, LocaleMessages } from './types.ts';

/** The interface in Italian. Anything left out falls back to the English word. */
export const it: LocaleMessages = {
  'attribution.chr1914-sl':
    'Testo sloveno: Chráska 1914, fonte di pubblico dominio digitalizzata da dLib.si. Errori OCR corretti per questa app.',
  'app.name': 'Riferimenti incrociati della Bibbia',
  'app.name.short': 'Riferimenti',

  'view.arcs': 'Archi',
  'view.arcs.short': 'Archi',
  'view.arcs.open': 'Mostra negli Archi',
  'view.threads': 'Fili',
  'view.threads.short': 'Fili',
  'view.threads.open': 'Leggi nel contesto',
  'view.switch': 'Visualizzazioni',

  'search.label': 'Vai a un passo biblico',
  'search.placeholder': 'Vai a…  Gv 3:16, Sal 23',

  'reference.unreadable': 'Inserisci un passo come «Gv 3:16» o «Sal 23».',
  'reference.unknownBook': (query) => `Libro sconosciuto «${query}».`,
  'reference.ambiguous': (query, candidates) => `«${query}» può essere ${candidates}.`,
  'reference.or': ' o ',
  'reference.chapters': (book, count, plural) =>
    plural === 1 ? `${book} ha ${count} capitolo.` : `${book} ha ${count} capitoli.`,
  'reference.verses': (reference, chapter, count, plural) =>
    plural === 1
      ? `${reference} ${chapter} ha ${count} versetto.`
      : `${reference} ${chapter} ha ${count} versetti.`,

  'menu.filtersChanged': 'Filtri (modificati)',
  'menu.filters': 'Filtri',
  'menu.filters.votes': 'Voti della comunità',
  'menu.filters.votes.all': 'Tutti',
  'menu.filters.votes.atLeast': (votes) => `≥ ${String(votes)}`,
  'menu.filters.note': (shown, total, threshold, hidden) =>
    `I voti indicano quanto i lettori di OpenBible.info hanno trovato utile un riferimento; non ` +
    `dimostrano che sia giusto o sbagliato. Mostrati ${shown} riferimenti su ${total} ` +
    `(${threshold}${hidden}).`,
  'menu.filters.hiddenGenres': (count) =>
    count === 1 ? ', 1 genere nascosto' : `, ${String(count)} generi nascosti`,
  'filter.allLinks': 'tutti i riferimenti',
  'filter.noDownvoted': 'riferimenti con voti negativi nascosti',
  'filter.atLeastVotes': (votes, plural) => (plural === 1 ? `≥ ${votes} voto` : `≥ ${votes} voti`),
  'menu.filters.tip': 'Suggerimento: tocca un genere nella legenda per nasconderlo o mostrarlo.',
  'menu.filters.reset': 'Reimposta i filtri',

  'attribution.bsb': 'Testo biblico: Berean Standard Bible (BSB), rilasciata in pubblico dominio.',
  'attribution.kjv':
    'Testo biblico: King James Version (Authorized Version), testo del 1769. Di pubblico ' +
    'dominio negli Stati Uniti e nella maggior parte del mondo; nel Regno Unito un brevetto ' +
    'regio riserva il diritto di stamparlo agli stampatori della Corona — Cambridge University ' +
    'Press, Oxford University Press e Collins.',
  'attribution.blivre':
    'Testo biblico: Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio e Marco Teles, febbraio ' +
    '2018 (edizione sul Textus Receptus), https://sites.google.com/site/biblialivre/. ' +
    'Modifiche: gli spazi sono stati normalizzati; nessuna parola è stata cambiata.',
  'attribution.luther1912':
    'Testo biblico: Lutherbibel 1912 (LUT), la revisione del 1912 della traduzione tedesca di ' +
    'Martin Lutero. Di pubblico dominio. Modifiche: la numerazione dei versetti propria ' +
    'dell’edizione è stata tolta da 358 versetti, e un frammento corrotto da Giudici 11:25; ' +
    'nessuna parola è stata cambiata.',
  'attribution.riveduta1927':
    'Testo biblico: Riveduta 1927 (RIV), la revisione italiana curata da Giovanni Luzzi. Di ' +
    'pubblico dominio. Modifiche: la numerazione dei versetti propria dell’edizione è stata ' +
    'tolta da 228 versetti, un titolo corrente da altri tre e un carattere spurio da 2 Samuele ' +
    '20:26; nessuna parola è stata cambiata.',
  'attribution.vbl':
    'Testo biblico: Versión Biblia Libre (VBL), © 2018–2020 Jonathan Gallagher e Shelly Barrios ' +
    'de Avila, con Gustavo Sanabria e Rebekah Põldaas, ' +
    'https://ebible.org/Scriptures/details.php?id=spavbl, con licenza CC BY-SA 4.0. ' +
    'Modifiche: in un versetto è stato spostato uno spazio prima dei due punti; nessuna parola ' +
    'è stata cambiata.',
  'license.publicDomain': 'Pubblico dominio',
  'menu.translation': 'Traduzione',
  'menu.translation.failed': (name) => `Non è stato possibile caricare ${name}.`,
  'menu.translation.error': (message) => `${message} Controlla la connessione e riprova.`,
  'menu.language': 'Lingua',

  'genres.label': 'Generi',
  'genres.labelChanged': 'Generi (modificati)',
  'genres.show': 'Mostra i generi',
  'genres.hide': 'Nascondi i generi',
  'genres.hideOne': (name) => `Nascondi ${name}`,
  'genres.showOne': (name) => `Mostra ${name}`,
  'testament.OT': 'Antico Testamento',
  'testament.NT': 'Nuovo Testamento',

  'stats.label': 'Riepilogo',
  'stats.verses': (count, plural): Emphasized => [
    { strong: count },
    plural === 1 ? ' versetto' : ' versetti',
  ],
  'stats.links': (shown, total, plural): Emphasized => {
    const links = plural === 1 ? 'riferimento mostrato' : 'riferimenti mostrati';
    return total === null
      ? [{ strong: shown }, ` ${links}`]
      : [{ strong: shown }, ` ${links} su ${total}`];
  },
  'stats.connected': (share): Emphasized => [{ strong: share }, ' dei versetti collegati'],
  'stats.crossTestament': (count, plural): Emphasized => [
    { strong: count },
    plural === 1 ? ' riferimento fra i Testamenti' : ' riferimenti fra i Testamenti',
  ],
  'hint.zoom': 'per ingrandire',
  'hint.pan': 'per spostare',
  'hint.focus': 'per scegliere',
  'hint.hold': 'tieni premuto per l’anteprima',

  'panel.details': 'Dettagli',
  'panel.expand': 'Espandi i dettagli',
  'panel.collapse': 'Comprimi i dettagli',
  'panel.close': 'Chiudi',
  'panel.previousVerse': 'Versetto precedente',
  'panel.nextVerse': 'Versetto successivo',
  'panel.previousChapter': 'Capitolo precedente',
  'panel.nextChapter': 'Capitolo successivo',
  'panel.copy': (reference) => `Copia ${reference} con il link`,
  'panel.copy.title': 'Copia con il link',
  'panel.copied': (reference) => `${reference} copiato`,
  'panel.omitted': (abbreviation) => `Non presente nella ${abbreviation}.`,
  'panel.moreVerses': (count, plural) =>
    plural === 1 ? `+ ${count} altro versetto` : `+ altri ${count} versetti`,
  'panel.showAll': (count) => `Mostra tutti i ${count}`,

  'note.toRange': (range) => `fino a ${range}`,
  'note.fromVerse': (verse) => `dal v. ${verse}`,
  'note.toVerse': (verse) => `al v. ${verse}`,

  'panel.connectsTo': 'Collegato a',
  'panel.connectsTo.note': (count) => (count === 1 ? '1 genere' : `${String(count)} generi`),
  'panel.references': 'Rimanda a',
  'panel.references.note': 'dove porta questo passo',
  'panel.referencedBy': 'Citato da',
  'panel.referencedBy.note': 'passi che rimandano qui',
  'panel.verses': 'Versetti',
  'panel.verses.note': 'tocca un versetto per sceglierlo',
  'panel.none': 'Nessuno',
  'panel.items': (plural) => (plural === 1 ? 'voce' : 'voci'),
  'panel.passages': (plural) => (plural === 1 ? 'passo' : 'passi'),
  'panel.linksCounted': (plural) => (plural === 1 ? 'riferimento' : 'riferimenti'),
  'panel.versesCounted': (plural) => (plural === 1 ? 'versetto' : 'versetti'),

  'words.heading': (language) => `Stessa parola ${language}`,
  'words.note': 'dove altro compare',
  'words.counted': (plural) => (plural === 1 ? 'parola' : 'parole'),
  'words.showMore': (count) => `Mostra altre ${count}`,
  'language.hebrew': 'ebraica',
  'language.greek': 'greca',
  'words.credit': (max) =>
    `, sulla base del lavoro della Tyndale House di Cambridge; ridotto alle forme del ` +
    `dizionario. Le parole che compaiono in più di ${max} versetti sono escluse.`,
  'words.creditLabel': 'Parole:',

  'loading.data': (verses, links) =>
    `Caricamento di ${verses} versetti e ${links} riferimenti incrociati…`,
  'error.datasetUnavailable':
    'Non è stato possibile caricare questa parte dei dati biblici. Controlla la connessione e ' +
    'riprova.',
  'error.retry': 'Riprova',
  'error.viewFailed': (view, message) => `Non è stato possibile avviare ${view}: ${message}`,

  'threads.direction': 'Direzione dei fili',
  'threads.outgoing': 'Da qui',
  'threads.incoming': 'Verso qui',
  'threads.both': 'Entrambi',
  'threads.verse': (number) => `Versetto ${number}: mostra i suoi collegamenti`,
  'threads.omitted': (abbreviation) =>
    `Non presente nella ${abbreviation} (assente nei manoscritti più antichi).`,
  'threads.spineHover': (count, plural) =>
    plural === 1
      ? `${count} filo da qui · clicca per leggere`
      : `${count} fili da qui · clicca per leggere`,
  'threads.chapters': 'Capitoli',
  'threads.previousChapter': 'Capitolo precedente',
  'threads.nextChapter': 'Capitolo successivo',
  'threads.stage':
    'Fili dai versetti di questo capitolo ai punti della Bibbia dove portano i loro riferimenti ' +
    'incrociati; la Bibbia è la barra verticale con tutti i 66 libri.',
  'arcs.connections': (count, plural) =>
    plural === 1 ? `${count} collegamento` : `${count} collegamenti`,
  'arcs.stage':
    'Diagramma ad archi dei riferimenti incrociati. Trascina o usa le frecce per spostare, ' +
    'scorri o premi +/- per ingrandire, clicca per scegliere un passo, Escape per azzerare. Su ' +
    'uno schermo tattile tieni premuto per l’anteprima di un passo.',

  'credits.links': 'Riferimenti:',
  'credits.fromTsk': ', dal Treasury of Scripture Knowledge',
  'credits.reindexed': ', reindicizzati',
  'credits.toKjv': ' secondo la numerazione dei versetti della KJV',
  'credits.text': 'Testo:',
  'credits.inspiredBy': 'Ispirato da',
  'credits.inspiration': (title, author) => `${title}, di ${author}`,

  'footer.source': 'Codice sorgente su GitHub',
  'footer.sourceLabel': 'GitHub',

  'install.link': 'Installa l’app',
  'install.linkLabel': 'Installa',
  'install.title': 'Installa l’app',
  'install.lede':
    'Tienila nella schermata Home e leggila anche senza connessione. Nessuno store, nessun ' +
    'account.',
  'install.now': 'Installa ora',
  'install.device': 'Dispositivo',
  'install.close': 'Chiudi',
  'install.whileOnline':
    'Apri l’app una volta mentre sei online: è allora che salva il testo biblico e i ' +
    'riferimenti incrociati sul tuo dispositivo.',
};
