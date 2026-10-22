import type { LocaleMessages } from './types.ts';
import type { Emphasized } from './types.ts';

/**
 * Ukrainian counts in three forms, not two: 1 вірш, 2 вірші, 5 віршів. English needs only a
 * singular and a plural, so the messages below are handed the count and choose for themselves.
 *
 * The rule is the standard one for East Slavic languages, and the teens are the exception that
 * makes it worth writing down rather than guessing: 21 takes the singular form and 11 does not.
 */
export function formOf(count: number, one: string, few: string, many: string): string {
  const lastDigit = Math.abs(count) % 10;
  const lastTwo = Math.abs(count) % 100;
  if (lastTwo >= 11 && lastTwo <= 14) {
    return many;
  }
  if (lastDigit === 1) {
    return one;
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return few;
  }
  return many;
}

/** The interface in Ukrainian. Anything left out falls back to the English word. */
export const uk: LocaleMessages = {
  'attribution.chr1914-sl':
    'Словенський текст: Chráska 1914, джерело в суспільному надбанні оцифроване dLib.si. Помилки OCR виправлено для цього застосунку.',
  'app.name': 'Перехресні посилання Біблії',
  'app.name.short': 'Перехресні посилання',

  'view.arcs': 'Арки',
  'view.arcs.short': 'Арки',
  'view.arcs.open': 'Показати в «Арках»',
  // Named for what the reader is looking at — one chapter at a time — rather than for the
  // shape of the lines. «Нитки» is sewing thread in Ukrainian and carries none of the
  // metaphor the English name does.
  'view.threads': 'Глави',
  'view.threads.short': 'Глави',
  'view.threads.open': 'Читати в контексті',
  'view.switch': 'Візуалізації',

  'search.label': 'Перейти до місця в Біблії',
  'search.placeholder': 'Перейти до…  Івана 3:16, Пс 23',

  'reference.unreadable': 'Введіть посилання, наприклад «Івана 3:16» або «Пс 23».',
  'reference.unknownBook': (query) => `Невідома книга «${query}».`,
  'reference.ambiguous': (query, candidates) => `«${query}» може бути: ${candidates}.`,
  'reference.or': ' або ',
  // No verb: `Псалми` and `Числа` are plural nouns and would want `мають`, while `Рут` wants
  // `має`. A colon sidesteps an agreement the app cannot know, and reads as naturally.
  'reference.chapters': (book, count, plural) =>
    `${book}: ${count} ${formOf(plural, 'глава', 'глави', 'глав')}.`,
  'reference.verses': (reference, chapter, count, plural) =>
    `${reference} ${chapter}: ${count} ${formOf(plural, 'вірш', 'вірші', 'віршів')}.`,

  'menu.filtersChanged': 'Фільтри (змінено)',
  'menu.filters': 'Фільтри',
  'menu.filters.votes': 'Голоси спільноти',
  'menu.filters.votes.all': 'Усі',
  'menu.filters.votes.atLeast': (votes) => `≥ ${String(votes)}`,
  'menu.filters.note': (shown, total, threshold, hidden) =>
    `Голоси показують, наскільки корисним читачі OpenBible.info вважають посилання; вони не ` +
    `доводять, що воно правильне чи хибне. Показано ${shown} з ${total} посилань ` +
    `(${threshold}${hidden}).`,
  'menu.filters.hiddenGenres': (count) =>
    `, приховано ${String(count)} ${formOf(count, 'жанр', 'жанри', 'жанрів')}`,
  'filter.allLinks': 'усі посилання',
  'filter.noDownvoted': 'без посилань з негативними голосами',
  'filter.atLeastVotes': (votes, count) =>
    `≥ ${votes} ${formOf(count, 'голос', 'голоси', 'голосів')}`,
  'menu.filters.tip': 'Підказка: торкніться жанру в легенді, щоб приховати або показати його.',
  'menu.filters.reset': 'Скинути фільтри',

  'attribution.bsb':
    'Біблійний текст: Berean Standard Bible (BSB), переданий у суспільне надбання.',
  'attribution.kjv':
    'Біблійний текст: King James Version (Authorized Version), текст 1769 року. Суспільне ' +
    'надбання у США та в більшості країн світу; у Сполученому Королівстві патент закріплює ' +
    'право друку за друкарями Корони — Cambridge University Press, Oxford University Press і ' +
    'Collins.',
  'attribution.blivre':
    'Біблійний текст: Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio і Marco Teles, ' +
    'лютий 2018 (видання Textus Receptus), https://sites.google.com/site/biblialivre/. ' +
    'Зміни: пробіли унормовано; жодного слова не змінено.',
  'attribution.luther1912':
    'Біблійний текст: Lutherbibel 1912 (LUT), редакція 1912 року німецького перекладу ' +
    'Мартіна Лютера. Суспільне надбання. Зміни: власні номери віршів цього видання вилучено ' +
    'з 358 віршів, а пошкоджений фрагмент — із Суддів 11:25; жодного слова не змінено.',
  'attribution.riveduta1927':
    'Біблійний текст: Riveduta 1927 (RIV), італійська редакція, здійснена під керівництвом ' +
    'Джованні Луцці. Суспільне надбання. Зміни: власні номери віршів цього видання вилучено ' +
    'з 228 віршів, колонтитул — ще з трьох, а випадковий символ — із 2 Самуїлової 20:26; ' +
    'жодного слова не змінено.',
  'attribution.vbl':
    'Біблійний текст: Versión Biblia Libre (VBL), © 2018–2020 Jonathan Gallagher і Shelly ' +
    'Barrios de Avila, за участю Gustavo Sanabria і Rebekah Põldaas, ' +
    'https://ebible.org/Scriptures/details.php?id=spavbl, за ліцензією CC BY-SA 4.0. ' +
    'Зміни: в одному вірші пробіл перед двокрапкою пересунуто; жодного слова не змінено.',
  'license.publicDomain': 'Суспільне надбання',
  'menu.translation': 'Переклад',
  'menu.translation.failed': (name) => `Не вдалося завантажити ${name}.`,
  'menu.translation.error': (message) => `${message} Перевірте з’єднання й спробуйте ще раз.`,
  'menu.language': 'Мова',

  'genres.label': 'Жанри',
  'genres.labelChanged': 'Жанри (змінено)',
  'genres.show': 'Показати жанри',
  'genres.hide': 'Приховати жанри',
  // Quoted, so the genre name can stay in the nominative: «Приховати «Великі пророки»» rather
  // than an accusative the app would have to inflect for each of the ten.
  'genres.hideOne': (name) => `Приховати «${name}»`,
  'genres.showOne': (name) => `Показати «${name}»`,
  'testament.OT': 'Старий Заповіт',
  'testament.NT': 'Новий Заповіт',

  'stats.label': 'Підсумок',
  'stats.verses': (count, plural): Emphasized => [
    { strong: count },
    ` ${formOf(plural, 'вірш', 'вірші', 'віршів')}`,
  ],
  'stats.links': (shown, total, plural): Emphasized => {
    const links = formOf(plural, 'посилання', 'посилання', 'посилань');
    return total === null
      ? [{ strong: shown }, ` ${links} показано`]
      : [{ strong: shown }, ` з ${total} ${links} показано`];
  },
  'stats.connected': (share): Emphasized => [{ strong: share }, ' віршів пов’язано'],
  'stats.crossTestament': (count, plural): Emphasized => [
    { strong: count },
    ` ${formOf(plural, 'посилання', 'посилання', 'посилань')} між Заповітами`,
  ],
  'hint.zoom': 'щоб масштабувати',
  'hint.pan': 'щоб пересувати',
  'hint.focus': 'щоб вибрати',
  'hint.hold': 'утримуйте для перегляду',

  'panel.details': 'Подробиці',
  'panel.expand': 'Розгорнути подробиці',
  'panel.collapse': 'Згорнути подробиці',
  'panel.close': 'Закрити',
  'panel.previousVerse': 'Попередній вірш',
  'panel.nextVerse': 'Наступний вірш',
  'panel.previousChapter': 'Попередня глава',
  'panel.nextChapter': 'Наступна глава',
  'panel.copy': (reference) => `Копіювати ${reference} з посиланням`,
  'panel.copy.title': 'Копіювати з посиланням',
  'panel.copied': (reference) => `${reference} скопійовано`,
  'panel.omitted': (abbreviation) => `Відсутній у ${abbreviation}.`,
  'panel.moreVerses': (count, plural) =>
    `+ ще ${count} ${formOf(plural, 'вірш', 'вірші', 'віршів')}`,
  'panel.showAll': (count) => `Показати всі ${count}`,

  'note.toRange': (range) => `до ${range}`,
  'note.fromVerse': (verse) => `від в. ${verse}`,
  'note.toVerse': (verse) => `до в. ${verse}`,

  'panel.connectsTo': 'Пов’язано з',
  'panel.connectsTo.note': (count) =>
    `${String(count)} ${formOf(count, 'жанр', 'жанри', 'жанрів')}`,
  'panel.references': 'Посилається на',
  'panel.references.note': 'куди вказує цей уривок',
  'panel.referencedBy': 'Посилаються сюди',
  'panel.referencedBy.note': 'уривки, що вказують сюди',
  'panel.verses': 'Вірші',
  'panel.verses.note': 'торкніться вірша, щоб вибрати його',
  'panel.none': 'Немає',
  'panel.items': (plural) => formOf(plural, 'позиція', 'позиції', 'позицій'),
  'panel.passages': (plural) => formOf(plural, 'уривок', 'уривки', 'уривків'),
  'panel.linksCounted': (plural) => formOf(plural, 'посилання', 'посилання', 'посилань'),
  'panel.versesCounted': (plural) => formOf(plural, 'вірш', 'вірші', 'віршів'),

  'words.heading': (language) => `Те саме ${language} слово`,
  'words.note': 'де воно ще вживається',
  'words.counted': (plural) => formOf(plural, 'слово', 'слова', 'слів'),
  'words.showMore': (count) => `Показати ще ${count}`,
  'language.hebrew': 'єврейське',
  'language.greek': 'грецьке',
  'words.credit': (max) =>
    `, на основі праці Tyndale House, Кембридж; зведено до словникових форм. Слова, що ` +
    `вживаються більш ніж у ${max} віршах, не включено.`,
  'words.creditLabel': 'Слова:',

  'loading.data': (verses, links) =>
    `Завантаження ${verses} віршів і ${links} перехресних посилань…`,
  'error.datasetUnavailable':
    'Не вдалося завантажити цю частину біблійних даних. Перевірте з’єднання й спробуйте ще раз.',
  'error.retry': 'Спробувати ще раз',
  'error.viewFailed': (view, message) => `Не вдалося запустити ${view}: ${message}`,

  'threads.direction': 'Напрямок посилань',
  // One word each. A segmented control has no room for a verb, and Ukrainian cannot leave an
  // option on a bare preposition the way English leaves "Points to".
  // Each option says what it selects on its own: a screen reader announces the option, not
  // the heading above it, and a bare adverb would carry nothing.
  'threads.outgoing': 'Від вірша',
  'threads.incoming': 'До вірша',
  'threads.both': 'Обидва',
  'threads.verse': (number) => `Вірш ${number}: показати його зв’язки`,
  'threads.omitted': (abbreviation) =>
    `Відсутній у ${abbreviation} (немає в найдавніших рукописах).`,
  'threads.spineHover': (count, plural) =>
    `${count} ${formOf(plural, 'посилання', 'посилання', 'посилань')} звідси · натисніть, щоб читати`,
  'threads.chapters': 'Глави',
  'threads.previousChapter': 'Попередня глава',
  'threads.nextChapter': 'Наступна глава',
  'threads.stage':
    'Лінії від віршів цієї глави до місць у Біблії, куди ведуть їхні перехресні ' +
    'посилання; Біблія показана вертикальною смугою з усіх 66 книг.',
  'arcs.connections': (count, plural) =>
    `${count} ${formOf(plural, 'зв’язок', 'зв’язки', 'зв’язків')}`,
  'arcs.stage':
    'Діаграма арок перехресних посилань. Тягніть або користуйтеся стрілками, щоб пересувати ' +
    'діаграму, прокручуйте чи натискайте +/-, щоб масштабувати, натисніть, щоб вибрати ' +
    'уривок, Escape — щоб скинути. На сенсорному екрані торкніться й утримуйте для перегляду ' +
    'уривка.',

  'credits.links': 'Посилання:',
  'credits.fromTsk': ', із Treasury of Scripture Knowledge',
  'credits.reindexed': ', переіндексовано',
  'credits.toKjv': ' за нумерацією віршів KJV',
  'credits.text': 'Текст:',
  'credits.inspiredBy': 'Натхнено роботою',
  'credits.inspiration': (title, author) => `${title}, автор ${author}`,

  'footer.source': 'Вихідний код на GitHub',
  'footer.sourceLabel': 'GitHub',

  'install.link': 'Встановити застосунок',
  'install.linkLabel': 'Встановити',
  'install.title': 'Встановити застосунок',
  'install.lede':
    'Тримайте його на головному екрані й читайте навіть без інтернету. Без магазину ' +
    'застосунків, без облікового запису.',
  'install.now': 'Встановити зараз',
  'install.device': 'Пристрій',
  'install.close': 'Закрити',
  'install.whileOnline':
    'Відкрийте застосунок один раз, поки ви онлайн: саме тоді він збереже біблійний текст і ' +
    'перехресні посилання на вашому пристрої.',
};
