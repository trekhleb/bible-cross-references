import { BOOKS } from '../../../src/core/bible/books.ts';
import { parseOsisId, toOsisId, type VerseIndex } from '../../../src/core/bible/verse-ref.ts';
import { CANONICAL_VERSIFICATION } from '../../../src/core/bible/versification.ts';
import {
  DATASET_SCHEMA_VERSION,
  type DatasetProvenance,
  type ImportNotice,
  type TranslationTextFile,
} from '../../../src/core/datasets/formats.ts';
import { stripByteOrderMark } from '../lib/files.ts';
import { createNotice } from '../lib/notices.ts';

/**
 * Importer for a local plain-text copy of the English Standard Version (`data/raw/esv.txt`, never
 * committed: the ESV is copyrighted).
 *
 * Format: one line per verse, four tab-separated columns: a `BBCCCVVV` code (book number 1–66 in
 * canonical order, chapter, verse), a book abbreviation, `<chapter>:<verse>`, and the text, e.g.
 * `01001001<TAB>Gn<TAB>1:1<TAB>In the beginning, …`. Verse 0 of each chapter is a heading
 * ("Chapter one", "Psalm three") and is skipped. Psalm titles are part of verse 1, as in the KJV.
 *
 * The ESV follows the KJV versification except that it leaves out verses absent from the earliest
 * manuscripts (they become empty text) and splits the last verse of 3 John in two.
 */

const LINE_PATTERN = /^(\d{2})(\d{3})(\d{3})\t[^\t]*\t(\d+):(\d+)\t(.*)$/;

/** Verses the ESV leaves out and gives in footnotes. Any other missing verse is an error. */
const OMITTED_VERSES: ReadonlySet<string> = new Set([
  'Matt.12.47',
  'Matt.17.21',
  'Matt.18.11',
  'Matt.23.14',
  'Mark.7.16',
  'Mark.9.44',
  'Mark.9.46',
  'Mark.11.26',
  'Mark.15.28',
  'Luke.17.36',
  'Luke.23.17',
  'John.5.4',
  'Acts.8.37',
  'Acts.15.34',
  'Acts.24.7',
  'Acts.28.29',
  'Rom.16.24',
]);

/** ESV verses outside the KJV versification, appended to the KJV verse that contains them. */
const MERGED_VERSES: ReadonlyMap<string, string> = new Map([['3John.1.15', '3John.1.14']]);

/** Straight quotes, like the rest of the text (a few verses have stray curly ones). */
function straightenQuotes(text: string): string {
  return text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
}

export function importEsvText(text: string, provenance: DatasetProvenance): TranslationTextFile {
  const versification = CANONICAL_VERSIFICATION;
  const osisIdAt = (index: VerseIndex) => toOsisId(versification.refAt(index));
  const verses = new Array<string | undefined>(versification.verseCount).fill(undefined);
  const merged: string[] = [];
  const straightened: string[] = [];

  stripByteOrderMark(text)
    .split(/\r?\n/)
    .forEach((line, offset) => {
      if (line.trim() === '') {
        return;
      }
      const lineNumber = offset + 1;
      const match = LINE_PATTERN.exec(line);
      if (!match) {
        throw new Error(`ESV line ${lineNumber}: unrecognized format: "${line.slice(0, 80)}".`);
      }
      const [, bookNumber = '', chapter = '', verse = '', label = '', labelVerse = '', raw = ''] =
        match;
      const book = BOOKS[Number(bookNumber) - 1];
      if (!book) {
        throw new Error(`ESV line ${lineNumber}: unknown book number ${bookNumber}.`);
      }
      const ref = { book: book.id, chapter: Number(chapter), verse: Number(verse) };
      if (Number(label) !== ref.chapter || Number(labelVerse) !== ref.verse) {
        throw new Error(
          `ESV line ${lineNumber}: code ${toOsisId(ref)} does not match "${label}:${labelVerse}".`,
        );
      }
      if (ref.verse === 0) {
        return;
      }

      const osisId = toOsisId(ref);
      const verseText = straightenQuotes(raw).replace(/\s+/g, ' ').trim();
      if (verseText !== raw.replace(/\s+/g, ' ').trim()) {
        straightened.push(osisId);
      }
      const mergeTarget = MERGED_VERSES.get(osisId);
      if (mergeTarget !== undefined) {
        const targetRef = parseOsisId(mergeTarget);
        const target = targetRef && versification.indexOf(targetRef);
        const targetText = target === undefined ? undefined : verses[target];
        if (target === undefined || targetText === undefined) {
          throw new Error(`ESV line ${lineNumber}: ${osisId} comes before ${mergeTarget}.`);
        }
        verses[target] = `${targetText} ${verseText}`;
        merged.push(osisId);
        return;
      }

      const index = versification.indexOf(ref);
      if (index === undefined) {
        throw new Error(`ESV line ${lineNumber}: ${osisId} is not in the KJV versification.`);
      }
      if (verses[index] !== undefined) {
        throw new Error(`ESV line ${lineNumber}: duplicate verse ${osisId}.`);
      }
      verses[index] = verseText;
    });

  const omitted: string[] = [];
  const missing: string[] = [];
  const complete = verses.map((verseText, index) => {
    if (verseText === undefined) {
      (OMITTED_VERSES.has(osisIdAt(index)) ? omitted : missing).push(osisIdAt(index));
    }
    return verseText ?? '';
  });
  if (missing.length > 0) {
    throw new Error(
      `ESV: ${missing.length} verses are missing, e.g. ${missing.slice(0, 5).join(', ')}.`,
    );
  }

  const notices: ImportNotice[] = [];
  if (omitted.length > 0) {
    notices.push(
      createNotice(
        'info',
        'Verses without text: the translation omits them (they are absent from the earliest ' +
          'manuscripts) and gives them in footnotes instead.',
        omitted,
      ),
    );
  }
  if (merged.length > 0) {
    notices.push(
      createNotice(
        'info',
        'Verses outside the KJV numbering, appended to the previous verse (e.g. 3 John 1:15 to 1:14).',
        merged,
      ),
    );
  }
  if (straightened.length > 0) {
    notices.push(
      createNotice('info', 'Curly quotes made straight, like the rest of the text.', straightened),
    );
  }
  return {
    format: 'translation-text',
    schemaVersion: DATASET_SCHEMA_VERSION,
    versification: versification.id,
    provenance,
    notices,
    translationId: 'esv',
    verses: complete,
  };
}
