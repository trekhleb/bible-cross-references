import { BOOKS, getReferenceName, type BookId } from '../../../src/core/bible/books.ts';
import { toOsisId, type VerseIndex } from '../../../src/core/bible/verse-ref.ts';
import { CANONICAL_VERSIFICATION } from '../../../src/core/bible/versification.ts';
import {
  DATASET_SCHEMA_VERSION,
  type DatasetProvenance,
  type TranslationTextFile,
} from '../../../src/core/datasets/formats.ts';
import { stripByteOrderMark } from '../lib/files.ts';
import { createNotice } from '../lib/notices.ts';

/**
 * Importer for the Berean Standard Bible plain-text edition (https://bereanbible.com/bsb.txt).
 *
 * Format: a few preamble lines, a `Verse<TAB>Berean Standard Bible` column header, then one line
 * per verse: `<Book name> <chapter>:<verse><TAB><text>`. Verses omitted from the translation
 * (e.g. Matthew 17:21) are present with empty text. The BSB uses the KJV versification.
 */

const COLUMN_HEADER = 'Verse\t';
const VERSE_LINE_PATTERN = /^(.+) (\d+):(\d+)\t(.*)$/;

const BOOK_IDS_BY_NAME: ReadonlyMap<string, BookId> = new Map(
  BOOKS.flatMap((book) => [
    [book.name, book.id],
    [getReferenceName(book), book.id],
  ]),
);

export function importBsbText(text: string, provenance: DatasetProvenance): TranslationTextFile {
  const versification = CANONICAL_VERSIFICATION;
  const lines = stripByteOrderMark(text).split(/\r?\n/);
  const headerLineIndex = lines.findIndex((line) => line.startsWith(COLUMN_HEADER));
  if (headerLineIndex === -1) {
    throw new Error('BSB: column header line ("Verse<TAB>…") not found.');
  }

  const verses = new Array<string | undefined>(versification.verseCount).fill(undefined);
  lines.slice(headerLineIndex + 1).forEach((line, offset) => {
    if (line.trim() === '') {
      return;
    }
    const lineNumber = headerLineIndex + offset + 2;
    const match = VERSE_LINE_PATTERN.exec(line);
    if (!match) {
      throw new Error(`BSB line ${lineNumber}: unrecognized format: "${line.slice(0, 80)}".`);
    }
    const [, bookName = '', chapter = '', verse = '', verseText = ''] = match;
    const book = BOOK_IDS_BY_NAME.get(bookName);
    if (!book) {
      throw new Error(`BSB line ${lineNumber}: unknown book "${bookName}".`);
    }
    const ref = { book, chapter: Number(chapter), verse: Number(verse) };
    const index = versification.indexOf(ref);
    if (index === undefined) {
      throw new Error(`BSB line ${lineNumber}: ${toOsisId(ref)} is not in the KJV versification.`);
    }
    if (verses[index] !== undefined) {
      throw new Error(`BSB line ${lineNumber}: duplicate verse ${toOsisId(ref)}.`);
    }
    verses[index] = verseText.trim();
  });

  const missing: VerseIndex[] = [];
  const complete = verses.map((verseText, index) => {
    if (verseText === undefined) {
      missing.push(index);
    }
    return verseText ?? '';
  });
  const osisIdAt = (index: VerseIndex) => toOsisId(versification.refAt(index));
  if (missing.length > 0) {
    throw new Error(
      `BSB: ${missing.length} verses are missing, e.g. ${missing.slice(0, 5).map(osisIdAt).join(', ')}.`,
    );
  }

  const omitted = complete.flatMap((verseText, index) =>
    verseText === '' ? [osisIdAt(index)] : [],
  );
  return {
    format: 'translation-text',
    schemaVersion: DATASET_SCHEMA_VERSION,
    versification: versification.id,
    provenance,
    notices:
      omitted.length > 0
        ? [
            createNotice(
              'info',
              'Verses without text: the translation omits them (they are absent from the ' +
                'earliest manuscripts) and gives them in footnotes instead.',
              omitted,
            ),
          ]
        : [],
    translationId: 'bsb',
    verses: complete,
  };
}
