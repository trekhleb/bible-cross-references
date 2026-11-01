import { describe, expect, it } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../../src/core/bible/versification.ts';
import {
  importStepBibleOccurrences,
  importStepBibleWords,
  type LexiconFile,
  type TaggedTextFile,
} from './stepbible.ts';

const LICENSE = { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' };
const ATTRIBUTION = 'Original-language words: STEP Bible (CC BY 4.0).';
const PROVENANCE = {
  url: 'https://example.org/tagged.txt',
  sha256: 'a'.repeat(64),
  retrievedAt: '2026-10-16',
};

/** A tagged line: reference, word, transliteration, English, tagging, morphology. */
function hebrew(reference: string, tagging: string): string {
  return [reference, 'word', 'word', 'word', tagging, 'HNcmsa'].join('\t');
}

/** Greek keeps its tagging one column earlier, with the morphology after an `=`. */
function greek(reference: string, tagging: string): string {
  return [reference, 'word (word)', 'word', `${tagging}=N-NSN`, 'lemma=gloss'].join('\t');
}

function lexicon(rows: readonly (readonly string[])[]): string {
  // The real shape: eStrong | dStrong = <how it relates> | uStrong | form | translit | morph |
  // gloss | meaning. The last column is the one that may not be shipped.
  return rows
    .map(([extended, disambiguated, unified, lemma, translit, pos, gloss]) =>
      [
        extended,
        `${disambiguated ?? ''} = a Name of`,
        unified,
        lemma,
        translit,
        pos,
        gloss,
        'RESTRICTED',
      ].join('\t'),
    )
    .join('\n');
}

const LEXICONS: readonly LexiconFile[] = [
  {
    language: 'hebrew',
    text: lexicon([
      // Two senses of one word, sharing a unified number: the disambiguated number tells them
      // apart, and keying on the unified one would lose the second and mislabel the first.
      ['H7225', 'H7225G', 'H7225G', 'רֵאשִׁית', 're.Shit', 'N:N-F', 'beginning'],
      ['H7225', 'H7225H', 'H7225G', 'רֵאשִׁית', 're.Shit', 'N:N-F', 'best'],
      // Two different words gathered under one unified number: Ham is a name of Ammon's line.
      ['H1990', 'H1990', 'H5983', 'הָ֑ם', 'ham', 'N:N-M-P', 'Ham'],
      ['H5983', 'H5983', 'H5983', 'עַמּוֹן', 'am.Mon', 'N:N-M-P', 'Ammon'],
      ['H0085', 'H0085', 'H0085', 'אַבְרָהָם', 'av.ra.Ham', 'N:N-M-P', 'Abraham'],
      ['H1961', 'H1961', 'H1961', 'הָיָה', 'ha.Yah', 'N:V', 'to be'],
    ]),
  },
  {
    language: 'greek',
    text: lexicon([
      ['G4128', 'G4128', 'G4128', 'πλῆθος', 'plēthos', 'G:N-N', 'multitude'],
      ['G1473', 'G1473', 'G1473', 'ἐγώ', 'egō', 'G:PerP', 'I'],
      ['G2532', 'G2532', 'G2532', 'καί', 'kai', 'G:Conj', 'and'],
      // A name borrowed from Hebrew: the unified number is the Hebrew one.
      ['G0011', 'G0011', 'H0085', 'Ἀβραάμ', 'A.bra.am', 'N:N-M-P', 'Abraham'],
    ]),
  },
];

function build(files: readonly TaggedTextFile[], maxVerses = 100) {
  return importStepBibleWords(files, LEXICONS, {
    maxVerses,
    license: LICENSE,
    attribution: ATTRIBUTION,
    provenance: PROVENANCE,
  });
}

function versesOf(
  dataset: ReturnType<typeof build>,
  strongs: string,
): readonly number[] | undefined {
  const at = dataset.words.strongs.indexOf(strongs);
  if (at < 0) {
    return undefined;
  }
  return dataset.words.verses.slice(dataset.words.offsets[at], dataset.words.offsets[at + 1]);
}

describe('importStepBibleWords', () => {
  it('reads a word and the verse it is in', () => {
    const dataset = build([{ language: 'hebrew', text: hebrew('Gen.1.1#01=L', '{H7225G}') }]);
    expect(dataset.words.strongs).toEqual(['H7225G']);
    expect(dataset.words.lemma).toEqual(['רֵאשִׁית']);
    expect(dataset.words.gloss).toEqual(['beginning']);
    expect(versesOf(dataset, 'H7225G')).toEqual([
      CANONICAL_VERSIFICATION.indexOf({ book: 'Gen', chapter: 1, verse: 1 }),
    ]);
  });

  it('takes the English reference, not the one in brackets', () => {
    // Hebrew Genesis 32:2 is English Genesis 32:1.
    const dataset = build([{ language: 'hebrew', text: hebrew('Gen.32.1(32.2)#01=L', '{H1961}') }]);
    expect(versesOf(dataset, 'H1961')).toEqual([
      CANONICAL_VERSIFICATION.indexOf({ book: 'Gen', chapter: 32, verse: 1 }),
    ]);
  });

  it('leaves out a psalm superscription, which English verse numbering has no slot for', () => {
    const dataset = build([
      {
        language: 'hebrew',
        text: [hebrew('Psa.3.0(3.1)#01=L', '{H0085}'), hebrew('Psa.3.1(3.2)#01=L', '{H1961}')].join(
          '\n',
        ),
      },
    ]);
    // Only the word of the numbered verse survives; the title's is left where it cannot be put.
    expect(dataset.words.strongs).toEqual(['H1961']);
    expect(versesOf(dataset, 'H1961')).toEqual([
      CANONICAL_VERSIFICATION.indexOf({ book: 'Ps', chapter: 3, verse: 1 }),
    ]);
    const notice = dataset.notices.find(({ message }) => message.includes('superscription'));
    expect(notice?.count).toBe(1);
  });

  it('ignores prefixes and suffixes, which are grammar rather than vocabulary', () => {
    const dataset = build([
      { language: 'hebrew', text: hebrew('Gen.1.1#01=L', 'H9003/{H7225G}/H9023') },
    ]);
    expect(dataset.words.strongs).toEqual(['H7225G']);
  });

  it('counts a word once per verse, however often it occurs in it', () => {
    const dataset = build([
      {
        language: 'greek',
        text: [greek('Act.5.14#01=NKO', 'G4128'), greek('Act.5.14#02=NKO', 'G4128')].join('\n'),
      },
    ]);
    expect(versesOf(dataset, 'G4128')).toHaveLength(1);
  });

  it('finds the dictionary entry of a name borrowed from the other language', () => {
    const dataset = build([{ language: 'greek', text: greek('Mat.1.1#08=NKO', 'G0011') }]);
    expect(dataset.words.lemma).toEqual(['Ἀβραάμ']);
    // A proper noun keeps its capital; the syllable dots of the source do not survive.
    expect(dataset.words.transliteration).toEqual(['Abraam']);
  });

  it('drops a word used in more verses than the cutoff allows', () => {
    const text = [
      greek('Mat.1.1#01=NKO', 'G4128'),
      greek('Mat.1.2#01=NKO', 'G4128'),
      greek('Mat.1.3#01=NKO', 'G4128'),
    ].join('\n');
    const dataset = build([{ language: 'greek', text }], 2);
    expect(dataset.words.strongs).toEqual([]);
    const notice = dataset.notices.find(({ message }) => message.includes('too common'));
    expect(notice?.examples).toEqual(['G4128']);
  });

  it('keeps the verses of a word in canonical order', () => {
    const text = [greek('Act.5.14#01=NKO', 'G4128'), greek('Luk.5.6#01=NKO', 'G4128')].join('\n');
    const verses = versesOf(build([{ language: 'greek', text }]), 'G4128') ?? [];
    expect(verses).toHaveLength(2);
    expect(verses[0]).toBeLessThan(verses[1] ?? 0);
  });

  it('tells apart two senses that share a unified number', () => {
    const text = [hebrew('Gen.1.1#01=L', '{H7225G}'), hebrew('Gen.49.3#01=L', '{H7225H}')].join(
      '\n',
    );
    const dataset = build([{ language: 'hebrew', text }]);
    expect(dataset.words.strongs).toEqual(['H7225G', 'H7225H']);
    expect(dataset.words.gloss).toEqual(['beginning', 'best']);
  });

  it('does not hand a word the entry of another that shares its unified number', () => {
    const dataset = build([{ language: 'hebrew', text: hebrew('Gen.19.38#01=L', '{H5983}') }]);
    expect(dataset.words.lemma).toEqual(['עַמּוֹן']);
    expect(dataset.words.gloss).toEqual(['Ammon']);
  });

  it('takes the verse from a square bracket, which numbers it as the KJV does', () => {
    // The two traditions number Philippians 1:16 and 1:17 the other way round.
    const dataset = build([{ language: 'greek', text: greek('Php.1.16[1.17]#01=NKO', 'G4128') }]);
    expect(versesOf(dataset, 'G4128')).toEqual([
      CANONICAL_VERSIFICATION.indexOf({ book: 'Phil', chapter: 1, verse: 17 }),
    ]);
  });

  it('passes over round and curly brackets, which number it another way again', () => {
    const text = [
      greek('1Ti.6.21{6.22}#01=NKO', 'G4128'),
      greek('Act.5.14(5.15)#01=NKO', 'G1473'),
    ].join('\n');
    const dataset = build([{ language: 'greek', text }]);
    expect(versesOf(dataset, 'G4128')).toEqual([
      CANONICAL_VERSIFICATION.indexOf({ book: '1Tim', chapter: 6, verse: 21 }),
    ]);
    expect(versesOf(dataset, 'G1473')).toEqual([
      CANONICAL_VERSIFICATION.indexOf({ book: 'Acts', chapter: 5, verse: 14 }),
    ]);
  });

  it('keeps both numbers of two Greek words written as one', () => {
    // κἀγώ is ἐγώ and καί run together, and carries both numbers.
    const line = ['Mat.2.8#19=NKO', 'κἀγὼ (kagō)', 'and I', 'G1473=P-1NS + G2532=CONJ', 'x'].join(
      '\t',
    );
    const dataset = build([{ language: 'greek', text: line }]);
    expect(dataset.words.strongs).toEqual(['G1473', 'G2532']);
  });

  it('refuses a line whose reference it cannot read, rather than dropping its words', () => {
    expect(() =>
      build([{ language: 'greek', text: greek('Act.5.14<5.15>#01=NKO', 'G4128') }]),
    ).toThrow(/cannot read/);
  });

  it('rejects a book code it does not know', () => {
    expect(() => build([{ language: 'hebrew', text: hebrew('Zzz.1.1#01=L', '{H1961}') }])).toThrow(
      /unknown book codes/,
    );
  });

  it('never takes the lexicon\'s restricted "Meaning" column', () => {
    // Column 6 is Tyndale's own gloss; column 7 is Abridged BDB, © Online Bible, which the
    // source says needs their permission before it is used. Only the gloss may be shipped.
    const withMeaning = [
      'G4128',
      'G4128 =',
      'G4128',
      'πλῆθος',
      'plēthos',
      'G:N-N',
      'multitude',
      'RESTRICTED',
    ].join('\t');
    const dataset = importStepBibleWords(
      [{ language: 'greek', text: greek('Act.5.14#01=NKO', 'G4128') }],
      [{ language: 'greek', text: withMeaning }],
      { maxVerses: 100, license: LICENSE, attribution: ATTRIBUTION, provenance: PROVENANCE },
    );
    expect(dataset.words.gloss).toEqual(['multitude']);
    expect(JSON.stringify(dataset)).not.toContain('RESTRICTED');
  });

  it('rejects a file with no tagged words at all', () => {
    expect(() => build([{ language: 'hebrew', text: 'nothing here' }])).toThrow(/no tagged words/);
  });

  it('rejects a verse number the chapter does not reach', () => {
    // Genesis 1 has 31 verses; a reference past the end would otherwise land silently nowhere.
    const text = [hebrew('Gen.1.1#01=L', '{H1961}'), hebrew('Gen.1.99#01=L', '{H1961}')].join('\n');
    expect(() => build([{ language: 'hebrew', text }])).toThrow(/outside the kjv versification/);
  });

  it('passes over a lexicon row with no dictionary form or no gloss', () => {
    const rows = [
      ['G4128', 'G4128 =', 'G4128', '', 'plēthos', 'G:N-N', 'multitude'].join('\t'),
      ['G1473', 'G1473 =', 'G1473', 'ἐγώ', 'egō', 'G:PerP', ''].join('\t'),
      ['G2532', 'G2532 =', 'G2532', 'καί', 'kai', 'G:Conj', 'and'].join('\t'),
    ].join('\n');
    const dataset = importStepBibleWords(
      [
        {
          language: 'greek',
          text: [
            greek('Act.5.14#01=NKO', 'G4128'),
            greek('Act.5.14#02=NKO', 'G1473'),
            greek('Act.5.14#03=NKO', 'G2532'),
          ].join('\n'),
        },
      ],
      [{ language: 'greek', text: rows }],
      { maxVerses: 100, license: LICENSE, attribution: ATTRIBUTION, provenance: PROVENANCE },
    );
    // Only the complete row is shown; the other two are reported rather than shown as numbers.
    expect(dataset.words.strongs).toEqual(['G2532']);
    const notice = dataset.notices.find(({ message }) => message.includes('no lexicon entry'));
    expect(notice?.count).toBe(2);
  });

  it('passes over a lexicon row whose number it cannot read', () => {
    const rows = [
      ['', 'not a number =', '', 'x', 'x', 'x', 'x'].join('\t'),
      ['G2532', 'G2532 =', 'G2532', 'καί', 'kai', 'G:Conj', 'and'].join('\t'),
    ].join('\n');
    const dataset = importStepBibleWords(
      [{ language: 'greek', text: greek('Act.5.14#01=NKO', 'G2532') }],
      [{ language: 'greek', text: rows }],
      { maxVerses: 100, license: LICENSE, attribution: ATTRIBUTION, provenance: PROVENANCE },
    );
    expect(dataset.words.strongs).toEqual(['G2532']);
  });

  it('rejects a lexicon with nothing usable in it at all', () => {
    expect(() =>
      importStepBibleWords(
        [{ language: 'greek', text: greek('Act.5.14#01=NKO', 'G2532') }],
        [{ language: 'greek', text: 'rubbish' }],
        { maxVerses: 100, license: LICENSE, attribution: ATTRIBUTION, provenance: PROVENANCE },
      ),
    ).toThrow(/no usable entries/);
  });

  it('falls back to the extended number where the disambiguated one is not listed', () => {
    // H1961 is tagged, but the lexicon lists that sense only under its extended number.
    const rows = ['H1961', 'H1961A = a form of', 'H1961', 'הָיָה', 'ha.Yah', 'N:V', 'to be'].join(
      '\t',
    );
    const dataset = importStepBibleWords(
      [{ language: 'hebrew', text: hebrew('Gen.1.1#01=L', '{H1961}') }],
      [{ language: 'hebrew', text: rows }],
      { maxVerses: 100, license: LICENSE, attribution: ATTRIBUTION, provenance: PROVENANCE },
    );
    expect(dataset.words.gloss).toEqual(['to be']);
  });
});

describe('importStepBibleOccurrences', () => {
  function occurrences(files: readonly TaggedTextFile[]) {
    return importStepBibleOccurrences(files, LEXICONS, {
      maxVerses: 100,
      license: LICENSE,
      attribution: ATTRIBUTION,
      provenance: PROVENANCE,
    });
  }

  function useOf(file: ReturnType<typeof occurrences>, entry: number) {
    const { grammar, grammarAt, english } = file.occurrences;
    return { grammar: grammar[grammarAt[entry] ?? -1], english: english[entry] };
  }

  it('lines up entry for entry with the words it belongs to', () => {
    const files: TaggedTextFile[] = [
      {
        language: 'hebrew',
        text: [hebrew('Gen.1.1#01=L', '{H7225G}'), hebrew('Gen.1.2#01=L', '{H1961}')].join('\n'),
      },
    ];
    const words = build(files);
    const file = occurrences(files);
    expect(file.format).toBe('word-occurrences');
    expect(file.verseEntries).toBe(words.words.verses.length);
    expect(file.occurrences.english).toHaveLength(words.words.verses.length);
  });

  it('takes the part of a Hebrew line that carries the word, with its language put back', () => {
    const line = [
      'Gen.1.1#01=L',
      'בְּ/רֵאשִׁית',
      'be./re.Shit',
      'in/ beginning',
      'H9003/{H7225G}',
      'HR/Ncfsa',
    ].join('\t');
    const file = occurrences([{ language: 'hebrew', text: line }]);
    expect(useOf(file, 0)).toEqual({ grammar: 'HNcfsa', english: 'beginning' });
  });

  it('keeps the whole English where a Hebrew line does not split evenly', () => {
    const line = ['Gen.1.1#01=L', 'w', 'w', 'in the beginning', 'H9003/{H7225G}', 'HR/Ncfsa'].join(
      '\t',
    );
    expect(useOf(occurrences([{ language: 'hebrew', text: line }]), 0).english).toBe(
      'in the beginning',
    );
  });

  it('takes the grammar written beside a Greek number, even in a word made of two', () => {
    const line = [
      'Mat.2.8#19=NKO',
      'κἀγὼ (kagō)',
      'I myself also',
      'G1473=P-1NS + G2532=CONJ',
    ].join('\t');
    const file = occurrences([{ language: 'greek', text: line }]);
    const words = build([{ language: 'greek', text: line }]);
    const at = (strongs: string) => words.words.offsets[words.words.strongs.indexOf(strongs)] ?? -1;
    expect(useOf(file, at('G1473'))).toEqual({ grammar: 'P-1NS', english: 'I myself also' });
    expect(useOf(file, at('G2532')).grammar).toBe('CONJ');
  });

  it('describes a word by its first use in a verse that uses it twice', () => {
    const lines = [
      ['Luk.5.6#01=NKO', 'w', 'first', 'G4128=N-NSN'].join('\t'),
      ['Luk.5.6#02=NKO', 'w', 'second', 'G4128=N-ASN'].join('\t'),
    ].join('\n');
    expect(useOf(occurrences([{ language: 'greek', text: lines }]), 0)).toEqual({
      grammar: 'N-NSN',
      english: 'first',
    });
  });
});
