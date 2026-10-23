import type { LocaleMessages } from './types.ts';

/** The interface in Portuguese. Anything left out falls back to the English word. */
export const pt: LocaleMessages = {
  'app.name': 'Referências Cruzadas da Bíblia',
  'app.name.short': 'Referências Cruzadas',

  'view.arcs': 'Arcos',
  'view.arcs.short': 'Arcos',
  'view.arcs.open': 'Ver nos Arcos',
  'view.threads': 'Fios',
  'view.threads.short': 'Fios',
  'view.threads.open': 'Ler no contexto',
  'view.switch': 'Visualizações',

  'search.label': 'Ir para uma referência bíblica',
  'search.placeholder': 'Ir para…  João 3:16, Sl 23',

  'reference.unreadable': 'Digite uma referência como “João 3:16” ou “Sl 23”.',
  'reference.unknownBook': (query) => `Livro desconhecido “${query}”.`,
  'reference.ambiguous': (query, candidates) => `“${query}” pode ser ${candidates}.`,
  'reference.or': ' ou ',
  'reference.chapters': (book, count, plural) =>
    plural === 1 ? `${book} tem ${count} capítulo.` : `${book} tem ${count} capítulos.`,
  'reference.verses': (reference, chapter, count, plural) =>
    plural === 1
      ? `${reference} ${chapter} tem ${count} versículo.`
      : `${reference} ${chapter} tem ${count} versículos.`,

  // Plural and masculine, agreeing with "Filtros".
  'menu.filtersChanged': 'Filtros (alterados)',
  'menu.filters': 'Filtros',
  'menu.filters.votes': 'Votos da comunidade',
  'menu.filters.votes.all': 'Todos',
  'menu.filters.votes.atLeast': (votes) => `≥ ${String(votes)}`,
  'menu.filters.note': (shown, total, threshold, hidden) =>
    `Os votos indicam o quanto os leitores do OpenBible.info acharam uma ligação útil; não ` +
    `provam que ela esteja certa ou errada. Exibindo ${shown} de ${total} ligações ` +
    `(${threshold}${hidden}).`,
  'menu.filters.hiddenGenres': (count) =>
    count === 1 ? ', 1 gênero oculto' : `, ${String(count)} gêneros ocultos`,
  'filter.allLinks': 'todas as ligações',
  'filter.noDownvoted': 'ligações com votos negativos ficam ocultas',
  'filter.atLeastVotes': (votes, plural) => (plural === 1 ? `≥ ${votes} voto` : `≥ ${votes} votos`),
  'menu.filters.tip': 'Dica: toque num gênero na legenda para ocultá-lo ou exibi-lo.',
  'menu.filters.reset': 'Restaurar filtros',

  'attribution.bsb': 'Texto bíblico: Berean Standard Bible (BSB), dedicada ao domínio público.',
  'attribution.kjv':
    'Texto bíblico: King James Version (Authorized Version), texto de 1769. Em domínio público ' +
    'nos Estados Unidos e na maior parte do mundo; no Reino Unido, uma carta-patente reserva o ' +
    'direito de imprimi-lo aos impressores da Coroa — Cambridge University Press, Oxford ' +
    'University Press e Collins.',
  'attribution.blivre':
    'Texto bíblico: Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio e Marco Teles, ' +
    'fevereiro de 2018 (edição Textus Receptus), https://sites.google.com/site/biblialivre/. ' +
    'Alterações: os espaços foram normalizados; nenhuma palavra foi alterada.',
  'attribution.luther1912':
    'Texto bíblico: Lutherbibel 1912 (LUT), a revisão de 1912 da tradução alemã de Martinho ' +
    'Lutero. Domínio público. Alterações: os números de versículo da própria edição foram ' +
    'retirados de 358 versículos, e um fragmento corrompido de Juízes 11:25; nenhuma palavra ' +
    'foi alterada.',
  'attribution.riveduta1927':
    'Texto bíblico: Riveduta 1927 (RIV), a revisão italiana feita sob a direção de Giovanni ' +
    'Luzzi. Domínio público. Alterações: os números de versículo da própria edição foram ' +
    'retirados de 228 versículos, um cabeçalho de página de três e um caractere solto de ' +
    '2 Samuel 20:26; nenhuma palavra foi alterada.',
  'attribution.vbl':
    'Texto bíblico: Versión Biblia Libre (VBL), © 2018–2020 Jonathan Gallagher y Shelly Barrios ' +
    'de Avila, com Gustavo Sanabria e Rebekah Põldaas, ' +
    'https://ebible.org/Scriptures/details.php?id=spavbl, sob licença CC BY-SA 4.0. ' +
    'Alterações: um espaço antes dos dois-pontos foi movido em um versículo; nenhuma palavra ' +
    'foi alterada.',
  'attribution.ubg':
    'Texto bíblico: Uwspółcześniona Biblia Gdańska (UBG), © 2018 Fundacja Wrota Nadziei, https://ebible.org/Scriptures/details.php?id=polubg, sob a licença CC BY-ND 4.0. Nenhuma palavra ou pontuação foi alterada.',
  'license.publicDomain': 'Domínio público',
  'menu.translation': 'Tradução',
  'menu.translation.failed': (name) => `Não foi possível carregar ${name}.`,
  'menu.translation.error': (message) => `${message} Verifique sua conexão e tente novamente.`,
  'menu.language': 'Idioma',

  'genres.label': 'Gêneros',
  // Plural and masculine, agreeing with "Gêneros".
  'genres.labelChanged': 'Gêneros (alterados)',
  'genres.show': 'Exibir gêneros',
  'genres.hide': 'Ocultar gêneros',
  'genres.hideOne': (name) => `Ocultar ${name}`,
  'genres.showOne': (name) => `Exibir ${name}`,
  'testament.OT': 'Antigo Testamento',
  'testament.NT': 'Novo Testamento',

  'stats.label': 'Resumo',
  'stats.verses': (count, plural) => [
    { strong: count },
    plural === 1 ? ' versículo' : ' versículos',
  ],
  'stats.links': (shown, total, plural) => {
    const links = plural === 1 ? 'ligação exibida' : 'ligações exibidas';
    return total === null
      ? [{ strong: shown }, ` ${links}`]
      : [{ strong: shown }, ` de ${total} ${links}`];
  },
  // "dos versículos conectados" would read as "of the connected verses"; this says that they are.
  'stats.connected': (share) => [{ strong: share }, ' dos versículos estão conectados'],
  'stats.crossTestament': (count, plural) => [
    { strong: count },
    plural === 1 ? ' ligação entre os testamentos' : ' ligações entre os testamentos',
  ],
  'hint.zoom': 'para ampliar',
  'hint.pan': 'para mover',
  'hint.focus': 'para focar',
  'hint.hold': 'segure para pré-visualizar',

  'panel.details': 'Detalhes',
  'panel.expand': 'Expandir detalhes',
  'panel.collapse': 'Recolher detalhes',
  'panel.close': 'Fechar',
  'panel.previousVerse': 'Versículo anterior',
  'panel.nextVerse': 'Próximo versículo',
  'panel.previousChapter': 'Capítulo anterior',
  'panel.nextChapter': 'Próximo capítulo',
  'panel.copy': (reference) => `Copiar ${reference} com um link`,
  'panel.copy.title': 'Copiar com um link',
  'panel.copied': (reference) => `${reference} copiado`,
  'panel.omitted': (abbreviation) => `Omitido na ${abbreviation}.`,
  'panel.moreVerses': (count, plural) =>
    plural === 1 ? `+ ${count} versículo` : `+ ${count} versículos`,
  'panel.showAll': (count) => `Ver todas as ${count}`,

  'note.toRange': (range) => `para ${range}`,
  'note.fromVerse': (verse) => `do v. ${verse}`,
  'note.toVerse': (verse) => `para o v. ${verse}`,

  'panel.connectsTo': 'Conecta-se a',
  'panel.connectsTo.note': (count) => (count === 1 ? '1 gênero' : `${String(count)} gêneros`),
  'panel.references': 'Referências',
  'panel.references.note': 'para onde esta passagem aponta',
  'panel.referencedBy': 'Referenciado por',
  'panel.referencedBy.note': 'que apontam para cá',
  'panel.verses': 'Versículos',
  'panel.verses.note': 'toque num para focá-lo',
  'panel.none': 'Nenhuma',
  'panel.items': (plural) => (plural === 1 ? 'item' : 'itens'),
  'panel.passages': (plural) => (plural === 1 ? 'passagem' : 'passagens'),
  'panel.linksCounted': (plural) => (plural === 1 ? 'ligação' : 'ligações'),
  'panel.versesCounted': (plural) => (plural === 1 ? 'versículo' : 'versículos'),

  // The language names are already in the case Portuguese wants them: a message puts its
  // arguments in place, it does not reshape them.
  'words.heading': (language) => `Mesma palavra ${language}`,
  'words.note': 'onde mais ela aparece',
  'words.counted': (plural) => (plural === 1 ? 'palavra' : 'palavras'),
  'words.showMore': (count) => `Ver mais ${count}`,
  'language.hebrew': 'hebraica',
  'language.greek': 'grega',
  'words.credit': (max) =>
    `, baseado no trabalho da Tyndale House, Cambridge; reduzido às formas de dicionário. ` +
    `Palavras usadas em mais de ${max} versículos ficam de fora.`,
  'words.creditLabel': 'Palavras:',

  'loading.data': (verses, links) =>
    `Carregando ${verses} versículos e ${links} referências cruzadas…`,
  'error.datasetUnavailable':
    'Não foi possível carregar esta parte dos dados da Bíblia. Verifique sua conexão e tente novamente.',
  'error.retry': 'Tentar novamente',
  'error.viewFailed': (view, message) => `Não foi possível iniciar ${view}: ${message}`,

  'threads.direction': 'Direção dos fios',
  'threads.outgoing': 'Aponta para',
  'threads.incoming': 'Apontado de',
  'threads.both': 'Ambos',
  'threads.verse': (number) => `Versículo ${number}: ver suas conexões`,
  'threads.omitted': (abbreviation) =>
    `Omitido na ${abbreviation} (não consta nos manuscritos mais antigos).`,
  'threads.spineHover': (count, plural) =>
    plural === 1 ? `${count} fio daqui · clique para ler` : `${count} fios daqui · clique para ler`,
  'threads.chapters': 'Capítulos',
  'threads.previousChapter': 'Capítulo anterior',
  'threads.nextChapter': 'Próximo capítulo',
  'threads.stage':
    'Fios que vão dos versículos deste capítulo até onde suas referências cruzadas chegam na ' +
    'Bíblia, exibidos como uma barra vertical com todos os 66 livros.',
  'arcs.connections': (count, plural) => (plural === 1 ? `${count} conexão` : `${count} conexões`),
  'arcs.stage':
    'Diagrama em arcos das referências cruzadas. Arraste ou use as setas para mover, role ou ' +
    '+/- para ampliar, clique para focar uma passagem, Esc para limpar. Numa tela sensível ao ' +
    'toque, toque e segure para pré-visualizar uma passagem.',

  'credits.links': 'Ligações:',
  'credits.fromTsk': ', do Treasury of Scripture Knowledge',
  'credits.reindexed': ', reindexadas',
  'credits.toKjv': ' para a numeração de versículos da KJV',
  'credits.text': 'Texto:',
  'credits.inspiredBy': 'Inspirado por',
  'credits.inspiration': (title, author) => `${title}, por ${author}`,

  'footer.source': 'Código-fonte no GitHub',
  'footer.sourceLabel': 'GitHub',

  'install.link': 'Instalar o aplicativo',
  'install.linkLabel': 'Instalar',
  'install.title': 'Instalar o aplicativo',
  'install.lede':
    'Deixe na sua tela inicial e leia sem conexão. Sem loja de aplicativos, sem conta.',
  'install.now': 'Instalar agora',
  'install.device': 'Dispositivo',
  'install.close': 'Fechar',
  'install.whileOnline':
    'Abra o aplicativo uma vez com conexão: é nesse momento que ele guarda o texto bíblico e as ' +
    'referências cruzadas no seu dispositivo.',
};
