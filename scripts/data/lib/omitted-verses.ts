import type { ImportNotice } from '../../../src/core/datasets/formats.ts';
import type { TranslationId } from '../../../src/core/datasets/ids.ts';
import { createNotice } from './notices.ts';

/**
 * The verses the earliest manuscripts do not have.
 *
 * A critical edition drops them and gives them in a footnote instead, keeping the number so that
 * every other verse keeps its own, and a source file carries them as an empty line. An edition
 * that follows the Textus Receptus prints all sixteen, which is why this is an allowance granted
 * per translation below rather than a rule for everybody.
 */
export const CRITICAL_TEXT_OMISSIONS: ReadonlySet<string> = new Set([
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

/**
 * Reports the verses a translation leaves blank, and refuses any blank the manuscripts do not
 * explain.
 *
 * A blank verse reads as harmless and is the one fault this pipeline cannot otherwise see. Every
 * other check an importer makes is about verse *keys*: that there are 31,102, that none repeats,
 * that none falls outside the canon. A translation that numbers its verses the Hebrew way passes
 * all of them while its *words* sit one verse off — Hebrew Bibles close Genesis 31, Numbers 29,
 * 1 Samuel 23 and Jonah 1 a verse earlier than the KJV does — and the only trace left in the data
 * is a run of blanks where each shift begins.
 *
 * eBible's Reina Valera 1909 is exactly that. It imports as 31,102 verses with nothing missing,
 * nothing repeated and nothing out of canon, and it is wrong: eighteen verses are blank. Six of
 * them are the start of a shift — their words sit in the next chapter's first slot, carrying the
 * 125 verses of Numbers 13, Numbers 30, 1 Samuel 24, Job 39, Hosea 12 and Jonah 2 one place out
 * of step. The other twelve were merged into the verse before and shift nothing. Nothing else
 * here would have stopped any of it. This is what stops it.
 *
 * A translation that really does omit something else — the longer ending of Mark, the woman taken
 * in adultery — is a decision worth making in the open, so it belongs in the set above rather
 * than in a rule that waves every blank through.
 */
/**
 * Which blanks each translation is allowed to have, and why.
 *
 * Per translation, not shared. The sixteen verses above explain a blank only in an edition that
 * actually leaves them out: the KJV, the Bíblia Livre, the Lutherbibel 1912 and the Riveduta
 * 1927 each print all sixteen, so for those a blank at Matt 17:21 is not an editorial decision,
 * it is something that went wrong upstream — and the one shared list waved it through and then
 * attached a notice telling the reader the translation omits the verse on purpose, which for
 * four of the six would have been untrue.
 *
 * A `Record<TranslationId, …>`, so adding a translation does not inherit an allowance: the
 * compiler asks which of the two this edition is, which is a question whoever adds it can
 * answer and nobody else can.
 */
const NO_OMISSIONS: ReadonlySet<string> = new Set();
const OMISSIONS_ALLOWED: Readonly<Record<TranslationId, ReadonlySet<string>>> = {
  bsb: CRITICAL_TEXT_OMISSIONS,
  vbl: CRITICAL_TEXT_OMISSIONS,
  'chr1914-sl': NO_OMISSIONS,
  kjv: NO_OMISSIONS,
  blivre: NO_OMISSIONS,
  luther1912: NO_OMISSIONS,
  riveduta1927: NO_OMISSIONS,
};

export function omittedVerseNotices(
  translationId: TranslationId,
  omitted: readonly string[],
): ImportNotice[] {
  const allowed = OMISSIONS_ALLOWED[translationId];
  const unexplained = omitted.filter((osisId) => !allowed.has(osisId));
  if (unexplained.length > 0) {
    const count = unexplained.length;
    throw new Error(
      `${translationId}: ${count === 1 ? '1 verse has' : `${String(count)} verses have`} no ` +
        `text and ${count === 1 ? 'is' : 'are'} not among the blanks this translation is ` +
        `allowed (see OMISSIONS_ALLOWED in this file) ` +
        `(${unexplained.slice(0, 5).join(', ')}). The usual cause is a translation numbered ` +
        `differently from the KJV, so check that the words of each are in the verse they belong ` +
        `to. If this translation really does leave the passage out — the longer ending of Mark ` +
        `and the woman taken in adultery are left out of that list on purpose, so that dropping ` +
        `them is somebody's decision — grant it the verses in OMISSIONS_ALLOWED. If it is a ` +
        `Textus Receptus edition it should have no blanks at all.`,
    );
  }
  return omitted.length > 0
    ? [
        createNotice(
          'info',
          'Verses without text: the translation omits them (they are absent from the earliest ' +
            'manuscripts) and gives them in footnotes instead.',
          omitted,
        ),
      ]
    : [];
}
