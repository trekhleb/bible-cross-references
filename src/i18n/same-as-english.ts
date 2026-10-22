import type { LocaleId } from './locale-id.ts';

/**
 * The few things a language says exactly as English says them, with the reason for each.
 *
 * `completeness.ts` treats a value left identical to English as untranslated, because that is
 * nearly always what it is: a stub nobody came back to. A handful of words really are the same
 * in both languages, so each one is written down here with why — an entry a reviewer cannot
 * explain is a bug, not an exemption.
 *
 * Keys are `<where>.<key>`, as the problems report them.
 */
export const SAME_AS_ENGLISH: Readonly<Record<LocaleId, Readonly<Record<string, string>>>> = {
  // English is not compared against itself.
  en: {},
  sl: {
    'messages.footer.sourceLabel': 'GitHub is a product name.',
    'messages.menu.filters.votes.atLeast': 'A mathematical comparison has the same notation.',
    'install.ios.label': 'iPhone is a product name.',
    'install.android.label': 'Android is a product name.',
    'books.Ezra.name': 'This biblical proper name is spelled identically in Slovenian.',
    'books.Job.name': 'This biblical proper name is spelled identically in Slovenian.',
    'books.Ezek.name': 'This biblical proper name is spelled identically in Slovenian.',
    'books.Dan.name': 'This biblical proper name is spelled identically in Slovenian.',
    'books.Joel.name': 'This biblical proper name is spelled identically in Slovenian.',
    'books.Amos.name': 'This biblical proper name is spelled identically in Slovenian.',
    'books.Nah.name': 'This biblical proper name is spelled identically in Slovenian.',
  },
  pt: {
    'messages.footer.sourceLabel': 'GitHub is a proper noun and is not translated.',
    'messages.menu.filters.votes.atLeast':
      'A mathematical symbol and a number (“≥ 4”), which read the same in both languages.',
    'install.ios.label': 'iPhone is a product name and is not translated.',
    'install.android.label': 'Android is a product name and is not translated.',
    'books.Dan.name': 'Daniel is spelled identically in Portuguese.',
    'books.Joel.name': 'Joel is spelled identically in Portuguese.',
    'books.1Sam.name': '1 Samuel is spelled identically in Portuguese.',
    'books.2Sam.name': '2 Samuel is spelled identically in Portuguese.',
  },
  de: {
    'messages.footer.sourceLabel': 'GitHub is a proper noun and is not translated.',
    'messages.menu.filters.votes.atLeast':
      'A mathematical symbol and a number (“≥ 4”), which read the same in both languages.',
    'install.ios.label': 'iPhone is a product name and is not translated.',
    'install.android.label': 'Android is a product name and is not translated.',
    'messages.panel.details': 'Details is the ordinary German word, borrowed long ago.',
    'messages.credits.text': 'Text: is spelled identically in German.',
    'books.Ps.referenceName': 'German cites a psalm as “Psalm 23,1”, the same word as English.',
    'books.Dan.name': 'Daniel is spelled identically in German.',
    'books.Hos.name': 'Hosea is spelled identically in German.',
    'books.Joel.name': 'Joel is spelled identically in German.',
    'books.Amos.name': 'Amos is spelled identically in German.',
    'books.Nah.name': 'Nahum is spelled identically in German.',
    'books.Hag.name': 'Haggai is spelled identically in German.',
    'books.Titus.name': 'Titus is spelled identically in German.',
    'books.Phlm.name': 'Philemon is spelled identically in German.',
  },
  it: {
    'messages.footer.sourceLabel': 'GitHub is a proper noun and is not translated.',
    'messages.menu.filters.votes.atLeast':
      'A mathematical symbol and a number (“≥ 4”), which read the same in both languages.',
    'install.ios.label': 'iPhone is a product name and is not translated.',
    'install.android.label': 'Android is a product name and is not translated.',
    'books.Amos.name': 'Amos is spelled identically in Italian.',
  },
  es: {
    'messages.footer.sourceLabel': 'GitHub is a proper noun and is not translated.',
    'messages.menu.filters.votes.atLeast':
      'A mathematical symbol and a number (“≥ 4”), which read the same in both languages.',
    'install.ios.label': 'iPhone is a product name and is not translated.',
    'install.android.label': 'Android is a product name and is not translated.',
    'books.Dan.name': 'Daniel is spelled identically in Spanish.',
    'books.Job.name': 'Job is spelled identically in Spanish.',
    'books.Joel.name': 'Joel is spelled identically in Spanish.',
    'books.1Sam.name': '1 Samuel is spelled identically in Spanish.',
    'books.2Sam.name': '2 Samuel is spelled identically in Spanish.',
  },
  uk: {
    'messages.footer.sourceLabel': 'GitHub is a proper noun and is not translated.',
    'messages.menu.filters.votes.atLeast':
      'A mathematical symbol and a number (“≥ 4”), which read the same in both languages.',
    'install.ios.label': 'iPhone is a product name and is not translated.',
    'install.android.label': 'Android is a product name and is not translated.',
  },
};
