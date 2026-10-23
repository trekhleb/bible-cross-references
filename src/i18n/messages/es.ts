import type { Emphasized, LocaleMessages } from './types.ts';

/** The interface in Spanish. Anything left out falls back to the English word. */
export const es: LocaleMessages = {
  'app.name': 'Referencias cruzadas de la Biblia',
  'app.name.short': 'Referencias',

  'view.arcs': 'Arcos',
  'view.arcs.short': 'Arcos',
  'view.arcs.open': 'Ver en los Arcos',
  'view.threads': 'Hilos',
  'view.threads.short': 'Hilos',
  'view.threads.open': 'Leer en su contexto',
  'view.switch': 'Visualizaciones',

  'search.label': 'Ir a un pasaje de la Biblia',
  'search.placeholder': 'Ir a…  Jn 3:16, Sal 23',

  'reference.unreadable': 'Escriba una referencia como «Jn 3:16» o «Sal 23».',
  'reference.unknownBook': (query) => `Libro desconocido «${query}».`,
  'reference.ambiguous': (query, candidates) => `«${query}» puede ser ${candidates}.`,
  'reference.or': ' o ',
  'reference.chapters': (book, count, plural) =>
    plural === 1 ? `${book} tiene ${count} capítulo.` : `${book} tiene ${count} capítulos.`,
  'reference.verses': (reference, chapter, count, plural) =>
    plural === 1
      ? `${reference} ${chapter} tiene ${count} versículo.`
      : `${reference} ${chapter} tiene ${count} versículos.`,

  'menu.filtersChanged': 'Filtros (modificados)',
  'menu.filters': 'Filtros',
  'menu.filters.votes': 'Votos de la comunidad',
  'menu.filters.votes.all': 'Todos',
  'menu.filters.votes.atLeast': (votes) => `≥ ${String(votes)}`,
  'menu.filters.note': (shown, total, threshold, hidden) =>
    `Los votos indican cuán útil les pareció una referencia a los lectores de OpenBible.info; ` +
    `no demuestran que sea correcta o incorrecta. Se muestran ${shown} de ${total} referencias ` +
    `(${threshold}${hidden}).`,
  'menu.filters.hiddenGenres': (count) =>
    count === 1 ? ', 1 género oculto' : `, ${String(count)} géneros ocultos`,
  'filter.allLinks': 'todas las referencias',
  'filter.noDownvoted': 'referencias con votos negativos ocultas',
  'filter.atLeastVotes': (votes, plural) => (plural === 1 ? `≥ ${votes} voto` : `≥ ${votes} votos`),
  'menu.filters.tip': 'Consejo: toque un género en la leyenda para ocultarlo o mostrarlo.',
  'menu.filters.reset': 'Restablecer los filtros',

  'attribution.bsb': 'Texto bíblico: Berean Standard Bible (BSB), liberada al dominio público.',
  'attribution.kjv':
    'Texto bíblico: King James Version (Authorized Version), texto de 1769. De dominio público ' +
    'en los Estados Unidos y en la mayor parte del mundo; en el Reino Unido, una patente real ' +
    'reserva el derecho de imprimirlo a los impresores de la Corona: Cambridge University ' +
    'Press, Oxford University Press y Collins.',
  'attribution.blivre':
    'Texto bíblico: Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio y Marco Teles, febrero ' +
    'de 2018 (edición del Textus Receptus), https://sites.google.com/site/biblialivre/. ' +
    'Cambios: se normalizaron los espacios; no se alteró ninguna palabra.',
  'attribution.luther1912':
    'Texto bíblico: Lutherbibel 1912 (LUT), la revisión de 1912 de la traducción alemana de ' +
    'Martín Lutero. De dominio público. Cambios: se quitó la numeración de versículos propia ' +
    'de la edición en 358 versículos, y un fragmento dañado en Jueces 11:25; no se alteró ' +
    'ninguna palabra.',
  'attribution.riveduta1927':
    'Texto bíblico: Riveduta 1927 (RIV), la revisión italiana dirigida por Giovanni Luzzi. De ' +
    'dominio público. Cambios: se quitó la numeración de versículos propia de la edición en ' +
    '228 versículos, un titulillo en otros tres y un carácter suelto en 2 Samuel 20:26; no se ' +
    'alteró ninguna palabra.',
  'attribution.vbl':
    'Texto bíblico: Versión Biblia Libre (VBL), © 2018–2020 Jonathan Gallagher y Shelly ' +
    'Barrios de Avila, con Gustavo Sanabria y Rebekah Põldaas, ' +
    'https://ebible.org/Scriptures/details.php?id=spavbl, bajo licencia CC BY-SA 4.0. ' +
    'Cambios: en un versículo se movió un espacio delante de los dos puntos; no se alteró ' +
    'ninguna palabra.',
  'attribution.ubg':
    'Texto bíblico: Uwspółcześniona Biblia Gdańska (UBG), © 2018 Fundacja Wrota Nadziei, https://ebible.org/Scriptures/details.php?id=polubg, bajo la licencia CC BY-ND 4.0. No se ha cambiado ninguna palabra ni signo de puntuación.',
  'license.publicDomain': 'Dominio público',
  'menu.translation': 'Traducción',
  'menu.translation.failed': (name) => `No se pudo cargar ${name}.`,
  'menu.translation.error': (message) => `${message} Revise su conexión e inténtelo de nuevo.`,
  'menu.language': 'Idioma',

  'genres.label': 'Géneros',
  'genres.labelChanged': 'Géneros (modificados)',
  'genres.show': 'Mostrar los géneros',
  'genres.hide': 'Ocultar los géneros',
  'genres.hideOne': (name) => `Ocultar ${name}`,
  'genres.showOne': (name) => `Mostrar ${name}`,
  'testament.OT': 'Antiguo Testamento',
  'testament.NT': 'Nuevo Testamento',

  'stats.label': 'Resumen',
  'stats.verses': (count, plural): Emphasized => [
    { strong: count },
    plural === 1 ? ' versículo' : ' versículos',
  ],
  'stats.links': (shown, total, plural): Emphasized => {
    const links = plural === 1 ? 'referencia mostrada' : 'referencias mostradas';
    return total === null
      ? [{ strong: shown }, ` ${links}`]
      : [{ strong: shown }, ` de ${total} ${links}`];
  },
  'stats.connected': (share): Emphasized => [{ strong: share }, ' de los versículos conectados'],
  'stats.crossTestament': (count, plural): Emphasized => [
    { strong: count },
    plural === 1 ? ' referencia entre los Testamentos' : ' referencias entre los Testamentos',
  ],
  'hint.zoom': 'para acercar',
  'hint.pan': 'para desplazar',
  'hint.focus': 'para elegir',
  'hint.hold': 'mantenga pulsado para la vista previa',

  'panel.details': 'Detalles',
  'panel.expand': 'Desplegar los detalles',
  'panel.collapse': 'Plegar los detalles',
  'panel.close': 'Cerrar',
  'panel.previousVerse': 'Versículo anterior',
  'panel.nextVerse': 'Versículo siguiente',
  'panel.previousChapter': 'Capítulo anterior',
  'panel.nextChapter': 'Capítulo siguiente',
  'panel.copy': (reference) => `Copiar ${reference} con un enlace`,
  'panel.copy.title': 'Copiar con un enlace',
  'panel.copied': (reference) => `${reference} copiado`,
  'panel.omitted': (abbreviation) => `No figura en la ${abbreviation}.`,
  'panel.moreVerses': (count, plural) =>
    plural === 1 ? `+ ${count} versículo más` : `+ ${count} versículos más`,
  'panel.showAll': (count) => `Mostrar los ${count}`,

  'note.toRange': (range) => `hasta ${range}`,
  'note.fromVerse': (verse) => `desde el v. ${verse}`,
  'note.toVerse': (verse) => `hasta el v. ${verse}`,

  'panel.connectsTo': 'Conecta con',
  'panel.connectsTo.note': (count) => (count === 1 ? '1 género' : `${String(count)} géneros`),
  'panel.references': 'Remite a',
  'panel.references.note': 'adónde apunta este pasaje',
  'panel.referencedBy': 'Citado por',
  'panel.referencedBy.note': 'pasajes que apuntan aquí',
  'panel.verses': 'Versículos',
  'panel.verses.note': 'toque un versículo para elegirlo',
  'panel.none': 'Ninguno',
  'panel.items': (plural) => (plural === 1 ? 'elemento' : 'elementos'),
  'panel.passages': (plural) => (plural === 1 ? 'pasaje' : 'pasajes'),
  'panel.linksCounted': (plural) => (plural === 1 ? 'referencia' : 'referencias'),
  'panel.versesCounted': (plural) => (plural === 1 ? 'versículo' : 'versículos'),

  'words.heading': (language) => `La misma palabra ${language}`,
  'words.note': 'dónde más aparece',
  'words.counted': (plural) => (plural === 1 ? 'palabra' : 'palabras'),
  'words.showMore': (count) => `Mostrar ${count} más`,
  'language.hebrew': 'hebrea',
  'language.greek': 'griega',
  'words.credit': (max) =>
    `, a partir del trabajo de Tyndale House, Cambridge; reducido a las formas del ` +
    `diccionario. Las palabras que aparecen en más de ${max} versículos quedan fuera.`,
  'words.creditLabel': 'Palabras:',

  'loading.data': (verses, links) =>
    `Cargando ${verses} versículos y ${links} referencias cruzadas…`,
  'error.datasetUnavailable':
    'No se pudo cargar esta parte de los datos bíblicos. Revise su conexión e inténtelo de ' +
    'nuevo.',
  'error.retry': 'Reintentar',
  'error.viewFailed': (view, message) => `No se pudo iniciar ${view}: ${message}`,

  'threads.direction': 'Dirección de los hilos',
  'threads.outgoing': 'Desde aquí',
  'threads.incoming': 'Hacia aquí',
  'threads.both': 'Ambos',
  'threads.verse': (number) => `Versículo ${number}: mostrar sus conexiones`,
  'threads.omitted': (abbreviation) =>
    `No figura en la ${abbreviation} (ausente en los manuscritos más antiguos).`,
  'threads.spineHover': (count, plural) =>
    plural === 1
      ? `${count} hilo desde aquí · pulse para leer`
      : `${count} hilos desde aquí · pulse para leer`,
  'threads.chapters': 'Capítulos',
  'threads.previousChapter': 'Capítulo anterior',
  'threads.nextChapter': 'Capítulo siguiente',
  'threads.stage':
    'Hilos desde los versículos de este capítulo hasta los lugares de la Biblia adonde llevan ' +
    'sus referencias cruzadas; la Biblia es la barra vertical con los 66 libros.',
  'arcs.connections': (count, plural) =>
    plural === 1 ? `${count} conexión` : `${count} conexiones`,
  'arcs.stage':
    'Diagrama de arcos de las referencias cruzadas. Arrastre o use las flechas para desplazar, ' +
    'desplace la rueda o pulse +/- para acercar, haga clic para elegir un pasaje, Escape para ' +
    'borrar. En una pantalla táctil, mantenga pulsado para ver la vista previa de un pasaje.',

  'credits.links': 'Referencias:',
  'credits.fromTsk': ', del Treasury of Scripture Knowledge',
  'credits.reindexed': ', reindexadas',
  'credits.toKjv': ' según la numeración de versículos de la KJV',
  'credits.text': 'Texto:',
  'credits.inspiredBy': 'Inspirado en',
  'credits.inspiration': (title, author) => `${title}, de ${author}`,

  'footer.source': 'Código fuente en GitHub',
  'footer.sourceLabel': 'GitHub',

  'install.link': 'Instalar la aplicación',
  'install.linkLabel': 'Instalar',
  'install.title': 'Instalar la aplicación',
  'install.lede':
    'Téngala en su pantalla de inicio y léala sin conexión. Sin tienda de aplicaciones, sin ' +
    'cuenta.',
  'install.now': 'Instalar ahora',
  'install.device': 'Dispositivo',
  'install.close': 'Cerrar',
  'install.whileOnline':
    'Abra la aplicación una vez mientras tenga conexión: es entonces cuando guarda el texto ' +
    'bíblico y las referencias cruzadas en su dispositivo.',
};
