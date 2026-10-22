import type { Emphasized } from './types.ts';

/**
 * Every word the interface says, in English.
 *
 * This file is the source of truth: `Messages` is derived from it, so a locale that misspells a
 * key, or gives a value the wrong shape, fails to compile. Values that take arguments are
 * functions rather than strings with placeholders — the compiler then checks the arguments too,
 * and each language can put the words in its own order and use as many plural forms as it needs.
 */
export const en = {
  'attribution.chr1914-sl':
    'Slovenian text: Chráska 1914, public-domain source digitized by dLib.si. OCR errors corrected for this app.',
  'app.name': 'Bible Cross-References',
  // Shown instead of the full name where the header has no room for it.
  'app.name.short': 'Cross-References',

  'view.arcs': 'Arcs',
  'view.arcs.short': 'Arcs',
  'view.arcs.open': 'Show in Arcs',
  'view.threads': 'Threads',
  'view.threads.short': 'Threads',
  'view.threads.open': 'Read in context',
  'view.switch': 'Visualizations',

  'search.label': 'Go to a Bible reference',
  'search.placeholder': 'Go to…  John 3:16, Ps 23',

  'reference.unreadable': 'Enter a reference like “John 3:16” or “Ps 23”.',
  'reference.unknownBook': (query: string) => `Unknown book “${query}”.`,
  'reference.ambiguous': (query: string, candidates: string) =>
    `“${query}” could be ${candidates}.`,
  'reference.or': ' or ',
  // The count comes through as a number as well as a formatted string. English needs it for the
  // five books of one chapter it would otherwise mis-say — Obadiah, Philemon, 2 John, 3 John and
  // Jude — and a language that counts in more than two forms needs it for most of the Bible.
  'reference.chapters': (book: string, count: string, plural: number) =>
    plural === 1 ? `${book} has ${count} chapter.` : `${book} has ${count} chapters.`,
  'reference.verses': (reference: string, chapter: string, count: string, plural: number) =>
    plural === 1
      ? `${reference} ${chapter} has ${count} verse.`
      : `${reference} ${chapter} has ${count} verses.`,

  'menu.filtersChanged': 'Filters (changed)',
  'menu.filters': 'Filters',
  'menu.filters.votes': 'Community votes',
  'menu.filters.votes.all': 'All',
  'menu.filters.votes.atLeast': (votes: number) => `≥ ${String(votes)}`,
  // The parenthesis opens and closes inside the message: a sentence a translator cannot see the
  // end of is one they cannot punctuate, and not every language closes a clause the way English
  // does. `hidden` is the genre clause, or empty.
  'menu.filters.note': (shown: string, total: string, threshold: string, hidden: string) =>
    `Votes rank how helpful OpenBible.info readers found a link; they don’t prove it right or ` +
    `wrong. Showing ${shown} of ${total} links (${threshold}${hidden}).`,
  'menu.filters.hiddenGenres': (count: number) =>
    count === 1 ? ', 1 genre hidden' : `, ${String(count)} genres hidden`,
  'filter.allLinks': 'all links',
  'filter.noDownvoted': 'links voted down are hidden',
  'filter.atLeastVotes': (votes: string, plural: number) =>
    plural === 1 ? `≥ ${votes} vote` : `≥ ${votes} votes`,
  'menu.filters.tip': 'Tip: tap a genre in the legend to hide or show it.',
  'menu.filters.reset': 'Reset filters',

  'attribution.bsb': 'Scripture text: Berean Standard Bible (BSB), dedicated to the public domain.',
  'attribution.kjv':
    'Scripture text: King James Version (Authorized Version), the 1769 text. Public domain in ' +
    'the United States and most of the world; in the United Kingdom, letters patent reserve ' +
    'the right to print it to the Crown’s patentees — Cambridge University Press, Oxford ' +
    'University Press and Collins.',
  'attribution.blivre':
    'Scripture text: Bíblia Livre (BLIVRE), © Diego Santos, Mario Sérgio and Marco Teles, ' +
    'February 2018 (Textus Receptus edition), https://sites.google.com/site/biblialivre/. ' +
    'Changed: whitespace was normalized; no word was altered.',
  'attribution.luther1912':
    'Scripture text: Lutherbibel 1912 (LUT), the 1912 revision of Martin Luther’s German ' +
    'translation. Public domain. Changed: the edition’s own verse numbers were taken out of ' +
    '358 verses and a corrupt token out of Judges 11:25; no word was altered.',
  'attribution.riveduta1927':
    'Scripture text: Riveduta 1927 (RIV), the Italian revision made under Giovanni Luzzi. ' +
    'Public domain. Changed: the edition’s own verse numbers were taken out of 228 verses, ' +
    'a running head out of three and a stray character out of 2 Samuel 20:26; no word was ' +
    'altered.',
  'attribution.vbl':
    'Scripture text: Versión Biblia Libre (VBL), © 2018–2020 Jonathan Gallagher y Shelly ' +
    'Barrios de Avila, with Gustavo Sanabria and Rebekah Põldaas, ' +
    'https://ebible.org/Scriptures/details.php?id=spavbl, licensed under CC BY-SA 4.0. ' +
    'Changed: a space before a colon was moved in one verse; no word was altered.',
  'license.publicDomain': 'Public domain',
  'menu.translation': 'Translation',
  'menu.translation.failed': (name: string) => `${name} could not be loaded.`,
  'menu.translation.error': (message: string) => `${message} Check your connection and try again.`,
  'menu.language': 'Language',

  'genres.label': 'Genres',
  'genres.labelChanged': 'Genres (changed)',
  'genres.show': 'Show genres',
  'genres.hide': 'Hide genres',
  'genres.hideOne': (name: string) => `Hide ${name}`,
  'genres.showOne': (name: string) => `Show ${name}`,
  'testament.OT': 'Old Testament',
  'testament.NT': 'New Testament',

  'stats.label': 'Summary',
  'stats.verses': (count: string, plural: number): Emphasized => [
    { strong: count },
    plural === 1 ? ' verse' : ' verses',
  ],
  'stats.links': (shown: string, total: string | null, plural: number): Emphasized => {
    const links = plural === 1 ? 'link' : 'links';
    return total === null
      ? [{ strong: shown }, ` ${links} shown`]
      : [{ strong: shown }, ` of ${total} ${links} shown`];
  },
  'stats.connected': (share: string): Emphasized => [{ strong: share }, ' of verses connected'],
  'stats.crossTestament': (count: string, plural: number): Emphasized => [
    { strong: count },
    plural === 1 ? ' link between the testaments' : ' links between the testaments',
  ],
  'hint.zoom': 'to zoom',
  'hint.pan': 'to pan',
  'hint.focus': 'to focus',
  'hint.hold': 'hold to preview',

  'panel.details': 'Details',
  'panel.expand': 'Expand details',
  'panel.collapse': 'Collapse details',
  'panel.close': 'Close',
  // One key per unit rather than a word slotted into a sentence: languages agree in gender
  // and number, and "previous" is not the same word before "verse" as before "chapter".
  'panel.previousVerse': 'Previous verse',
  'panel.nextVerse': 'Next verse',
  'panel.previousChapter': 'Previous chapter',
  'panel.nextChapter': 'Next chapter',
  'panel.copy': (reference: string) => `Copy ${reference} with a link`,
  'panel.copy.title': 'Copy with a link',
  'panel.copied': (reference: string) => `${reference} copied`,
  'panel.omitted': (abbreviation: string) => `Omitted in the ${abbreviation}.`,
  'panel.moreVerses': (count: string, plural: number) =>
    plural === 1 ? `+ ${count} more verse` : `+ ${count} more verses`,
  'panel.showAll': (count: string) => `Show all ${count}`,

  'note.toRange': (range: string) => `to ${range}`,
  'note.fromVerse': (verse: string) => `from v. ${verse}`,
  'note.toVerse': (verse: string) => `to v. ${verse}`,

  'panel.connectsTo': 'Connects to',
  'panel.connectsTo.note': (count: number) => (count === 1 ? '1 genre' : `${String(count)} genres`),
  'panel.references': 'References',
  'panel.references.note': 'where this passage points',
  'panel.referencedBy': 'Referenced by',
  'panel.referencedBy.note': 'passages that point here',
  'panel.verses': 'Verses',
  'panel.verses.note': 'tap one to focus it',
  'panel.none': 'None',
  'panel.items': (plural: number): string => (plural === 1 ? 'item' : 'items'),
  'panel.passages': (plural: number): string => (plural === 1 ? 'passage' : 'passages'),
  'panel.linksCounted': (plural: number): string => (plural === 1 ? 'link' : 'links'),
  'panel.versesCounted': (plural: number): string => (plural === 1 ? 'verse' : 'verses'),

  'words.heading': (language: string) => `Same ${language} word`,
  'words.note': 'where else it is used',
  'words.counted': (plural: number): string => (plural === 1 ? 'word' : 'words'),
  'words.showMore': (count: string) => `Show ${count} more`,
  'language.hebrew': 'Hebrew',
  'language.greek': 'Greek',
  'words.credit': (max: string) =>
    `, based on work at Tyndale House, Cambridge; reduced to dictionary forms. Words used in ` +
    `more than ${max} verses are left out.`,
  'words.creditLabel': 'Words:',

  'loading.data': (verses: string, links: string) =>
    `Loading ${verses} verses and ${links} cross-references…`,
  // What a reader meets when a dataset will not load: almost always the network, and almost
  // always on a device that is offline rather than a machine missing a build step.
  'error.datasetUnavailable':
    'This part of the Bible data could not be loaded. Check your connection and try again.',
  'error.retry': 'Retry',
  'error.viewFailed': (view: string, message: string) => `${view} could not start: ${message}`,

  'threads.direction': 'Thread direction',
  'threads.outgoing': 'Points to',
  'threads.incoming': 'Pointed from',
  'threads.both': 'Both',
  'threads.verse': (number: string) => `Verse ${number}: show its connections`,
  'threads.omitted': (abbreviation: string) =>
    `Omitted in the ${abbreviation} (not in the earliest manuscripts).`,
  'threads.spineHover': (count: string, plural: number) =>
    plural === 1
      ? `${count} thread from here · click to read`
      : `${count} threads from here · click to read`,
  'threads.chapters': 'Chapters',
  'threads.previousChapter': 'Previous chapter',
  'threads.nextChapter': 'Next chapter',
  'threads.stage':
    'Threads from the verses of this chapter to where their cross-references land in the Bible, ' +
    'shown as a vertical bar of all 66 books.',
  'arcs.connections': (count: string, plural: number) =>
    plural === 1 ? `${count} connection` : `${count} connections`,
  'arcs.stage':
    'Arc diagram of cross-references. Drag or use the arrow keys to pan, scroll or +/- to zoom, ' +
    'click to focus a passage, Escape to clear. On a touch screen, touch and hold to preview a ' +
    'passage.',

  'credits.links': 'Links:',
  'credits.fromTsk': ', from the Treasury of Scripture Knowledge',
  'credits.reindexed': ', re-indexed',
  'credits.toKjv': ' to KJV verse numbering',
  'credits.text': 'Text:',
  'credits.inspiredBy': 'Inspired by',
  'credits.inspiration': (title: string, author: string) => `${title}, by ${author}`,

  'footer.source': 'Source code on GitHub',
  'footer.sourceLabel': 'GitHub',

  'install.link': 'Install the app',
  'install.linkLabel': 'Install',
  'install.title': 'Install the app',
  'install.lede':
    'Keep it on your home screen and read it with no connection. No app store, no account.',
  'install.now': 'Install now',
  'install.device': 'Device',
  'install.close': 'Close',
  'install.whileOnline':
    'Open the app once while you are online: that is when it stores the Bible text and the ' +
    'cross-references on your device.',
} as const;
