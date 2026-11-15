import { readFileSync } from 'node:fs';
import { RAW_DATA_DIR } from './lib/paths.ts';
import { join } from 'node:path';
import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../src/core/bible/versification.ts';
import { toOsisId } from '../../src/core/bible/verse-ref.ts';
import type { TranslationId } from '../../src/core/datasets/ids.ts';
import { sha256Hex } from './lib/files.ts';
import { defectsFor } from './lib/source-defects.ts';
import { DATASET_BUILDERS, type RawSourceContent } from './datasets.ts';
import { BOOK_CODES as KJV_CODES } from './importers/ebible-vpl.ts';
import { expectMember, findSource, readSources, type RawSource } from './lib/sources.ts';

/** The archive entry each zipped source pins, mirroring `data/sources.json`. */
const MEMBERS: Readonly<Record<string, string>> = {
  kjv: 'eng-kjv2006_vpl.txt',
  luther1912: 'deu1912_vpl.txt',
  riveduta1927: 'ita1927_vpl.txt',
  vbl: 'spavbl_vpl.txt',
};

/**
 * A pin whose digest, URL and retrieval date are each unique to the source they belong to.
 *
 * One shared digest for all of them would be satisfied by a builder that never looked at its
 * pin — including one that copied a digest out of the file it was reading, which is a number
 * about nothing: the build verifies the bytes it read, and a dataset claiming any other digest
 * sends a reader to check a file nobody has.
 */
function source(id: string): RawSource {
  const member = MEMBERS[id];
  return {
    id,
    description: id,
    url: `https://example.org/${id}`,
    fileName: `${id}.txt`,
    sha256: sha256Hex(strToU8(id)),
    ...(member === undefined ? {} : { member }),
    // Unique per source as well, so that a date taken from the clock rather than from the pin
    // is a failure here instead of a field nobody checks.
    retrievedAt: `2026-01-${String((id.length % 28) + 1).padStart(2, '0')}`,
    license: 'CC BY 4.0',
    homepage: 'https://example.org/',
  };
}

/** The three fields a dataset is allowed to say about where it came from. */
function provenanceFields(from: {
  readonly url: string;
  readonly sha256: string;
  readonly retrievedAt: string;
}): Record<string, string> {
  return { url: from.url, sha256: from.sha256, retrievedAt: from.retrievedAt };
}

/**
 * Verses whose square brackets do not open and close within the one verse.
 *
 * Brackets stay in the text, because they are the translators' own mark for a word they supplied
 * — the KJV carries them in 14,241 verses and the Bíblia Livre in 4,838, every one of them
 * closing where it opened. The app addresses one verse at a time and shows one verse at a time,
 * so a bracket that opens in one and closes in another is not that mark: it is a span taken from
 * an edition laid out in paragraphs, and what reaches the reader is a stray `[` ending a
 * sentence.
 *
 * Walked rather than counted, because equal counts are not balance: a verse in the middle of two
 * carried-over spans reads `…faith] and [the works…` and has one of each.
 */
function unbalancedBracketVerses(verses: readonly string[]): string[] {
  const offenders: string[] = [];
  verses.forEach((text, index) => {
    let depth = 0;
    for (const character of text) {
      if (character === '[') {
        depth += 1;
      } else if (character === ']') {
        depth -= 1;
      }
      if (depth < 0) {
        break;
      }
    }
    if (depth !== 0) {
      offenders.push(toOsisId(CANONICAL_VERSIFICATION.refAt(index)));
    }
  });
  return offenders;
}

/**
 * What `license` may say: a licence, and for one source a note naming the jurisdiction it is
 * qualified in.
 *
 * The field is free text, and every reader of it — the README's table, the credit in the app, a
 * maintainer deciding whether a text can ship — treats it as a licence. A sentence recording
 * that nobody knows yet passes `expectString` exactly as happily as `CC BY 4.0` does, and then
 * the only place the uncertainty is written down is the field that is supposed to resolve it.
 *
 * The trailing note is deliberately narrow. Allowing any parenthesis at all lets the same
 * uncertainty back in reworded — `Public domain (unverified; local preview only)` — so it has to
 * match the shape the KJV's Crown-copyright qualification actually has and nothing looser.
 */
const RECOGNISED_LICENSE =
  /^(Public domain|CC0 1\.0|CC BY(-SA)? \d\.\d( [A-Z]{2})?)( \([A-Z][\w ]+: [^();]+\))?$/;

/**
 * Hosts a source may be fetched from.
 *
 * `https://` alone says a URL is fetchable, not that anyone but this project's upstreams is
 * serving it. Scripture arriving from a contributor's own bucket, gist or working directory is
 * the shape that cannot be checked by anybody later, however well-formed its pin is.
 */
const UPSTREAM_HOSTS: readonly string[] = [
  'https://ebible.org/Scriptures/',
  'https://bereanbible.com/',
  'https://a.openbible.info/',
  'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/',
  'https://github.com/blivre/BibliaLivre/releases/',
];

/** One line per verse of the whole canon, which is what every importer insists on. */
function everyVerse(render: (index: number) => string): string {
  return Array.from({ length: CANONICAL_VERSIFICATION.verseCount }, (_, index) =>
    render(index),
  ).join('\n');
}

/**
 * Every fixture text says which translation it is, in every verse.
 *
 * A builder that reaches for the wrong archive — the wrong source id, the wrong entry inside it —
 * produces a perfectly valid dataset of somebody else's scripture under this translation's name,
 * licence and credit. Nothing about its shape is wrong, so only the words can give it away.
 */
const BSB = everyVerse((index) => {
  const ref = CANONICAL_VERSIFICATION.refAt(index);
  const book = CANONICAL_VERSIFICATION.bookAt(index);
  return `${book.name} ${String(ref.chapter)}:${String(ref.verse)}\tbsb ${String(index)}.`;
});

/**
 * An eBible verse-per-line text that names itself in every verse, and carries whatever
 * `source-defects.ts` says this translation's upstream file carries.
 *
 * The defects are read from the list rather than written out here. The importer refuses to
 * build when a correction matches nothing, which is what catches a mistyped `remove` against
 * the real archive — and a fixture with the defects hand-written in would have to be edited
 * every time the list changes, which is the kind of coupling that gets a check deleted.
 */
function verseLines(id: TranslationId): string {
  const defects = defectsFor(id);
  return everyVerse((index) => {
    const ref = CANONICAL_VERSIFICATION.refAt(index);
    const code = KJV_CODES[CANONICAL_VERSIFICATION.bookAt(index).id];
    const defect = defects.get(toOsisId(ref));
    return (
      `${code} ${String(ref.chapter)}:${String(ref.verse)} ${id} ${String(index)}.` +
      (defect === undefined ? '' : defect.remove)
    );
  });
}

const CONTENT: Readonly<Record<string, string | Uint8Array>> = {
  'chr1914-sl': readFileSync(join(RAW_DATA_DIR, 'chr1914-sl.draft.json'), 'utf8')
    .replaceAll('V začetku je ustvaril Bog nebesa in zemljo.', 'chr1914-sl fixture')
    .replace(
      'https://www.dlib.si/details/URN%3ANBN%3ASI%3Adoc-ME2U9X4P',
      'https://example.org/chr1914-sl',
    ),
  bsb: `The Holy Bible, Berean Standard Bible\nVerse\tBerean Standard Bible\n${BSB}`,
  kjv: zipSync({ 'eng-kjv2006_vpl.txt': strToU8(verseLines('kjv')) }),
  blivre: zipSync({ 'bliv-tr_vpl.txt': strToU8(verseLines('blivre')) }),
  luther1912: zipSync({ 'deu1912_vpl.txt': strToU8(verseLines('luther1912')) }),
  riveduta1927: zipSync({ 'ita1927_vpl.txt': strToU8(verseLines('riveduta1927')) }),
  vbl: zipSync({ 'spavbl_vpl.txt': strToU8(verseLines('vbl')) }),
  openbible: zipSync({
    'cross_references.txt': strToU8(
      'From Verse\tTo Verse\tVotes\t# CC-BY 2026-01-01\nGen.1.1\tJohn.1.1\t5',
    ),
  }),
  'stepbible-tagnt-mat-jhn': 'Mat.1.1#01=NKO\tx\ty\tG0976=N-NSF\tz',
  'stepbible-tagnt-act-rev': '',
  'stepbible-tahot-gen-deu': 'Gen.1.1#01=L\tx\ty\tz\t{H7225G}\tHNcfsa',
  'stepbible-tahot-jos-est': '',
  'stepbible-tahot-job-sng': '',
  'stepbible-tahot-isa-mal': '',
  'stepbible-tbesg': ['G0976', 'G0976 =', 'G0976', 'βίβλος', 'biblos', 'G:N-F', 'book', ''].join(
    '\t',
  ),
  'stepbible-tbesh': [
    'H7225',
    'H7225G =',
    'H7225G',
    'רֵאשִׁית',
    're.Shit',
    'N:N-F',
    'beginning',
    '',
  ].join('\t'),
};

/**
 * A reader that remembers which pins it handed out.
 *
 * A builder is given `{ source, content }` and is free to use only the second. Keeping the pins
 * it was offered is what lets a test say where a dataset's provenance came from, rather than
 * only what shape it has.
 */
function recordingReader(): {
  readonly read: (id: string) => Promise<RawSourceContent>;
  readonly offered: readonly RawSource[];
} {
  const offered: RawSource[] = [];
  return {
    offered,
    read: (id) => {
      const content = CONTENT[id];
      if (content === undefined) {
        throw new Error(`The test has no content for "${id}".`);
      }
      const pin = source(id);
      offered.push(pin);
      return Promise.resolve({
        source: pin,
        content: Buffer.from(typeof content === 'string' ? strToU8(content) : content),
      });
    },
  };
}

const { read: readSource } = recordingReader();

/**
 * The pins each dataset is built from, in the order its builder reads them.
 *
 * Declared here because "which file is this scripture" is the question provenance answers, and
 * the answer has to be checkable against something other than the builder itself. Requiring the
 * exact set closes the gap a membership test leaves: a builder that reads a source it never uses
 * is handed that pin too, and may then publish it as the origin of a text it had no part in.
 *
 * Cross-checked against `data/sources.json` below, so this cannot drift into describing a
 * pipeline the build does not have.
 */
const PINS_READ: Readonly<Record<string, readonly string[]>> = {
  'data/translations/bsb.json': ['bsb'],
  'data/translations/kjv.json': ['kjv'],
  'data/translations/blivre.json': ['blivre'],
  'data/translations/luther1912.json': ['luther1912'],
  'data/translations/riveduta1927.json': ['riveduta1927'],
  'data/translations/vbl.json': ['vbl'],
  'data/cross-references/openbible.json': ['openbible'],
  // Six files of words and two lexicons. The first stands for the set in the dataset's
  // provenance, and the rest are listed beside it in data/sources.json.
  'data/words/stepbible.json': [
    'stepbible-tahot-gen-deu',
    'stepbible-tahot-jos-est',
    'stepbible-tahot-job-sng',
    'stepbible-tahot-isa-mal',
    'stepbible-tagnt-mat-jhn',
    'stepbible-tagnt-act-rev',
    'stepbible-tbesh',
    'stepbible-tbesg',
  ],
};

describe('DATASET_BUILDERS', () => {
  it('has one builder per dataset the app loads', () => {
    expect(DATASET_BUILDERS.map((builder) => builder.outputPath)).toEqual([
      'data/translations/bsb.json',
      'data/translations/kjv.json',
      'data/translations/blivre.json',
      'data/translations/luther1912.json',
      'data/translations/riveduta1927.json',
      'data/translations/vbl.json',
      'data/translations/chr1914-sl.json',
      'data/cross-references/openbible.json',
      'data/words/stepbible.json',
    ]);
  });

  it('writes every dataset under public/data', () => {
    for (const builder of DATASET_BUILDERS) {
      expect(builder.outputPath.startsWith('data/')).toBe(true);
      expect(builder.outputPath.endsWith('.json')).toBe(true);
    }
  });

  it.each(DATASET_BUILDERS.map((b) => [b.outputPath, b] as const))(
    'builds %s from its pinned sources',
    async (path, builder) => {
      const reader = recordingReader();
      const dataset = await builder.build(reader.read);
      expect(dataset.versification).toBe('kjv');
      expect(dataset.schemaVersion).toBe(1);
      expect(Array.isArray(dataset.notices)).toBe(true);

      // Exactly the pins this dataset is declared to be built from, so reading a source and not
      // using it cannot quietly make its pin an acceptable origin.
      expect(reader.offered.map((pin) => pin.id)).toEqual(PINS_READ[path]);

      // Provenance has to be one whole pin the build verified, not three fields that each happen
      // to match some pin. Checking only that the digest is 64 hex characters and the URL looks
      // like a URL is satisfied by a file that describes itself — and self-description is the
      // one thing this field exists to rule out, because the digest it publishes is what a
      // reader would re-download and hash to check the scripture for themselves.
      const [first] = reader.offered;
      expect(first, `${path} read no pinned source`).toBeDefined();
      if (first) {
        expect(provenanceFields(dataset.provenance)).toEqual(provenanceFields(first));
      }

      if (dataset.format === 'translation-text') {
        // The words have to be this translation's own. Everything above passes just as happily
        // when a builder has been wired to another translation's archive.
        expect(dataset.verses[0], `${dataset.translationId} read another text`).toContain(
          dataset.translationId,
        );
        // Every slot of the canon, asserted on the built dataset rather than inside one importer:
        // a builder that does not use one is still answerable for the shape it ships.
        expect(dataset.verses).toHaveLength(CANONICAL_VERSIFICATION.verseCount);
        // A translation is served on its own and kept on readers' devices by the offline cache,
        // so the file has to say whose text it is. `formats.ts` leaves both fields optional for
        // the cache's sake, which means the compiler cannot ask for them and only a check here
        // keeps a build from shipping scripture with no licence and no credit at all.
        expect(dataset.license?.name, `${dataset.translationId} ships a licence name`).toBeTruthy();
        expect(dataset.license?.url, `${dataset.translationId} ships a licence URL`).toBeTruthy();
        expect(dataset.attribution, `${dataset.translationId} ships a credit`).toBeTruthy();
        expect(
          unbalancedBracketVerses(dataset.verses),
          `${dataset.translationId} leaves a bracket open across verses`,
        ).toEqual([]);
      }
    },
  );

  it('passes the words builder its licence and credit, from one place', async () => {
    const words = DATASET_BUILDERS.find((b) => b.outputPath.includes('words'));
    const dataset = await words?.build(readSource);
    if (dataset?.format !== 'original-words') {
      throw new Error('Expected the words dataset.');
    }
    expect(dataset.license).toEqual({
      name: 'CC BY 4.0',
      url: 'https://creativecommons.org/licenses/by/4.0/',
    });
    expect(dataset.attribution).toContain('STEP Bible');
  });
});

describe('the pins and the importers', () => {
  it('agree on which entry of an archive is read', async () => {
    // A pin covers one file. If a builder reaches for a different entry than the pin names, the
    // scripture it ships is never checked against anything — and nothing would say so.
    const sources = await readSources();
    for (const source of sources) {
      if (source.member === undefined) {
        continue;
      }
      expect(expectMember(source), source.id).toBe(source.member);
      expect(source.fileName.endsWith('.zip'), `${source.id} pins an entry of a ZIP`).toBe(true);
    }
  });

  it('reads the same archive entries the real sources pin', async () => {
    // Asserting `MEMBERS` against its own literal would only restate it. These are the names the
    // builders are exercised against above, so if they drift from `data/sources.json` the suite
    // is testing a shape the build does not have.
    const sources = await readSources();
    for (const [id, member] of Object.entries(MEMBERS)) {
      expect(findSource(sources, id).member, id).toBe(member);
    }
    expect(Object.keys(MEMBERS).toSorted()).toEqual(
      sources
        .filter((source) => source.member !== undefined)
        .map((source) => source.id)
        .toSorted(),
    );
  });

  it('names an upstream download, and a real licence, for every source', async () => {
    // `url` is what `npm run data:fetch` downloads and re-pins, and `license` is what the README
    // table, the credit in the app and a maintainer deciding whether a text can ship all read.
    // A `url` that is not one cannot be fetched or re-pinned, so its checksum stops being
    // something a fetch verified and becomes a number somebody typed beside a file.
    const sources = await readSources();
    for (const source of sources) {
      expect(
        UPSTREAM_HOSTS.some((host) => source.url.startsWith(host)),
        `${source.id} is served from one of ${UPSTREAM_HOSTS.join(', ')}, not ${source.url}`,
      ).toBe(true);
      expect(source.homepage, `${source.id} homepage`).toMatch(/^https:\/\//);
      expect(source.license, `${source.id} licence`).toMatch(RECOGNISED_LICENSE);
    }
  });

  it('builds every dataset from a declared pin, and every pin into a dataset', async () => {
    // Keeps `PINS_READ` honest in both directions: an id it names that no longer exists, and a
    // source added to the pin file that no builder reads — which would sit there pinned,
    // fetched and credited while contributing nothing to the app.
    const sources = await readSources();
    const declared = Object.values(PINS_READ).flat().toSorted();
    expect(declared).toEqual(sources.map((source) => source.id).toSorted());
    expect(Object.keys(PINS_READ).toSorted()).toEqual(
      DATASET_BUILDERS.map((builder) => builder.outputPath).toSorted(),
    );
  });

  it('pins every eBible archive by its entry rather than by the archive', async () => {
    // eBible rebuilds its archives on a schedule. The files inside do not change, but a ZIP
    // stores each entry's timestamp, so a pin on the archive fails on an ordinary day for a
    // reason that has nothing to do with scripture. Every source read from one names its entry.
    const sources = await readSources();
    for (const source of sources.filter(({ url }) => url.includes('ebible.org'))) {
      expect(source.member, `${source.id} pins an entry`).toBeDefined();
    }
  });
});

/**
 * A check is only as good as the shapes it rejects, and every shape below is one a real pull
 * request shipped past the suite as it stood. The positive cases are already asserted against
 * live data above, so only the refusals are written out: a later edit that widens the pattern
 * has to delete one of these to go green.
 */
describe('the shapes those checks refuse', () => {
  it('refuses a licence field that records uncertainty instead of a licence', () => {
    for (const value of [
      'Unverified; local preview only',
      'Local OCR preview; distribution status unverified',
      // Parenthesised, which the KJV's jurisdiction note has to be allowed to be.
      'Public domain (unverified; local preview only)',
      'CC BY 4.0 (status unknown, do not ship)',
      '',
    ]) {
      expect(value, `${value} is not a licence`).not.toMatch(RECOGNISED_LICENSE);
    }
  });

  it('reports a bracket left open across two verses, and allows a supplied word', () => {
    // The shape an editorial span leaves when it is carried across verse boundaries: the reader
    // of the first verse is shown a sentence ending in `[`, and of the second one ending in `]`.
    // The third verse is a translator's own supplied word, which is the thing not to break.
    expect(
      unbalancedBracketVerses([
        'and nothing shall be impossible to you. [',
        'But if you do not forgive, neither will your Father forgive.]',
        'In the beginning God created [the] heaven and [[the]] earth.',
      ]),
    ).toEqual(['Gen.1.1', 'Gen.1.2']);
  });
});
