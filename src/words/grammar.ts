import type { LocaleId } from '../i18n/locale-id.ts';

/**
 * Tyndale's grammar codes, read out in words.
 *
 * The Greek codes are Robinson's (`V-AAI-3S`, `N-GSF`, `P-1NS`); the Hebrew and Aramaic ones are
 * those of the Open Scriptures Hebrew Bible, prefixed with the language (`HVqp3ms`, `HNcfsa`,
 * `AVhp3ms`). A part a table does not know is left out rather than guessed, so an unusual code
 * reads shorter, never wrong; one that cannot be read at all is shown as it is.
 *
 * Polish and English are written out; every other language reads the English, which is what the
 * codes' own documentation uses.
 */
interface GrammarVocabulary {
  readonly greekParts: Readonly<Record<string, string>>;
  readonly hebrewParts: Readonly<Record<string, string>>;
  readonly tense: Readonly<Record<string, string>>;
  readonly voice: Readonly<Record<string, string>>;
  readonly mood: Readonly<Record<string, string>>;
  readonly hebrewStem: Readonly<Record<string, string>>;
  readonly aramaicStem: Readonly<Record<string, string>>;
  readonly aspect: Readonly<Record<string, string>>;
  readonly case: Readonly<Record<string, string>>;
  readonly number: Readonly<Record<string, string>>;
  readonly gender: Readonly<Record<string, string>>;
  readonly state: Readonly<Record<string, string>>;
  readonly person: (person: string) => string;
}

const EN: GrammarVocabulary = {
  greekParts: {
    N: 'noun',
    V: 'verb',
    A: 'adjective',
    T: 'article',
    P: 'personal pronoun',
    R: 'relative pronoun',
    C: 'reciprocal pronoun',
    D: 'demonstrative pronoun',
    F: 'reflexive pronoun',
    I: 'interrogative pronoun',
    K: 'correlative pronoun',
    Q: 'correlative pronoun',
    S: 'possessive pronoun',
    X: 'indefinite pronoun',
    ADV: 'adverb',
    CONJ: 'conjunction',
    COND: 'conditional',
    PREP: 'preposition',
    PRT: 'particle',
    INJ: 'interjection',
    HEB: 'Hebrew word',
    ARAM: 'Aramaic word',
  },
  hebrewParts: {
    N: 'noun',
    Np: 'proper noun',
    A: 'adjective',
    Ac: 'number',
    Ao: 'ordinal number',
    V: 'verb',
    R: 'preposition',
    C: 'conjunction',
    D: 'adverb',
    T: 'particle',
    P: 'pronoun',
    S: 'suffix',
  },
  tense: {
    P: 'present',
    I: 'imperfect',
    F: 'future',
    A: 'aorist',
    '2A': 'aorist',
    R: 'perfect',
    '2R': 'perfect',
    L: 'pluperfect',
  },
  voice: {
    A: 'active',
    M: 'middle',
    P: 'passive',
    E: 'middle or passive',
    D: 'middle',
    O: 'passive',
    N: 'middle or passive',
  },
  mood: {
    I: 'indicative',
    S: 'subjunctive',
    O: 'optative',
    M: 'imperative',
    N: 'infinitive',
    P: 'participle',
    R: 'participle',
  },
  hebrewStem: {
    q: 'qal',
    Q: 'qal passive',
    N: 'niphal',
    p: 'piel',
    P: 'pual',
    h: 'hiphil',
    H: 'hophal',
    t: 'hithpael',
    o: 'polel',
    O: 'polal',
    r: 'hithpolel',
    m: 'poel',
    M: 'poal',
    l: 'pilpel',
    L: 'polpal',
    f: 'hithpalpel',
    D: 'nithpael',
  },
  aramaicStem: {
    q: 'peal',
    Q: 'peil',
    u: 'hithpeel',
    p: 'pael',
    P: 'ithpaal',
    M: 'hithpaal',
    a: 'aphel',
    h: 'haphel',
    s: 'saphel',
    e: 'shaphel',
    H: 'hophal',
    i: 'ithpeel',
  },
  aspect: {
    p: 'perfect',
    q: 'sequential perfect',
    i: 'imperfect',
    w: 'sequential imperfect',
    h: 'cohortative',
    j: 'jussive',
    v: 'imperative',
    r: 'active participle',
    s: 'passive participle',
    a: 'infinitive absolute',
    c: 'infinitive construct',
  },
  case: { N: 'nominative', G: 'genitive', D: 'dative', A: 'accusative', V: 'vocative' },
  number: { S: 'singular', P: 'plural', s: 'singular', p: 'plural', d: 'dual' },
  gender: {
    M: 'masculine',
    F: 'feminine',
    N: 'neuter',
    m: 'masculine',
    f: 'feminine',
    b: 'both genders',
    c: 'common gender',
  },
  state: { a: 'absolute', c: 'construct', d: 'determined' },
  person: (person) => `${person}${person === '1' ? 'st' : person === '2' ? 'nd' : 'rd'} person`,
};

const PL: GrammarVocabulary = {
  greekParts: {
    N: 'rzeczownik',
    V: 'czasownik',
    A: 'przymiotnik',
    T: 'rodzajnik',
    P: 'zaimek osobowy',
    R: 'zaimek względny',
    C: 'zaimek wzajemny',
    D: 'zaimek wskazujący',
    F: 'zaimek zwrotny',
    I: 'zaimek pytający',
    K: 'zaimek korelatywny',
    Q: 'zaimek korelatywny',
    S: 'zaimek dzierżawczy',
    X: 'zaimek nieokreślony',
    ADV: 'przysłówek',
    CONJ: 'spójnik',
    COND: 'spójnik warunkowy',
    PREP: 'przyimek',
    PRT: 'partykuła',
    INJ: 'wykrzyknik',
    HEB: 'słowo hebrajskie',
    ARAM: 'słowo aramejskie',
  },
  hebrewParts: {
    N: 'rzeczownik',
    Np: 'nazwa własna',
    A: 'przymiotnik',
    Ac: 'liczebnik',
    Ao: 'liczebnik porządkowy',
    V: 'czasownik',
    R: 'przyimek',
    C: 'spójnik',
    D: 'przysłówek',
    T: 'partykuła',
    P: 'zaimek',
    S: 'przyrostek',
  },
  tense: {
    P: 'czas teraźniejszy',
    I: 'imperfectum',
    F: 'czas przyszły',
    A: 'aoryst',
    '2A': 'aoryst',
    R: 'perfectum',
    '2R': 'perfectum',
    L: 'plusquamperfectum',
  },
  voice: {
    A: 'strona czynna',
    M: 'strona zwrotna',
    P: 'strona bierna',
    E: 'strona zwrotna lub bierna',
    D: 'strona zwrotna',
    O: 'strona bierna',
    N: 'strona zwrotna lub bierna',
  },
  mood: {
    I: 'tryb oznajmujący',
    S: 'tryb łączący',
    O: 'optativus',
    M: 'tryb rozkazujący',
    N: 'bezokolicznik',
    P: 'imiesłów',
    R: 'imiesłów',
  },
  hebrewStem: EN.hebrewStem,
  aramaicStem: EN.aramaicStem,
  aspect: {
    p: 'perfectum',
    q: 'perfectum z waw',
    i: 'imperfectum',
    w: 'imperfectum z waw',
    h: 'kohortatyw',
    j: 'jusyw',
    v: 'tryb rozkazujący',
    r: 'imiesłów czynny',
    s: 'imiesłów bierny',
    a: 'bezokolicznik absolutny',
    c: 'bezokolicznik konstrukcyjny',
  },
  case: { N: 'mianownik', G: 'dopełniacz', D: 'celownik', A: 'biernik', V: 'wołacz' },
  number: { S: 'lp.', P: 'lm.', s: 'lp.', p: 'lm.', d: 'liczba podwójna' },
  gender: {
    M: 'r. męski',
    F: 'r. żeński',
    N: 'r. nijaki',
    m: 'r. męski',
    f: 'r. żeński',
    b: 'oba rodzaje',
    c: 'rodzaj wspólny',
  },
  state: { a: 'stan absolutny', c: 'status constructus', d: 'z rodzajnikiem' },
  person: (person) => `${person} os.`,
};

function vocabularyFor(localeId: LocaleId): GrammarVocabulary {
  return localeId === 'pl' ? PL : EN;
}

function present(...parts: readonly (string | undefined)[]): string[] {
  return parts.filter((part): part is string => part !== undefined && part !== '');
}

/** Case, number and gender, as `N-NSM`'s last part writes them. */
function caseNumberGender(code: string, words: GrammarVocabulary): string[] {
  const [kase = '', number = '', gender = ''] = code;
  return present(words.case[kase], words.number[number], words.gender[gender]);
}

function describeGreek(code: string, words: GrammarVocabulary): string[] {
  const [part = '', ...rest] = code.split('-');
  const label = words.greekParts[part];
  if (label === undefined) {
    return [];
  }
  if (part === 'V') {
    const [form = '', inflection = ''] = rest;
    const match = /^(2?[A-Z])([A-Z])([A-Z])$/.exec(form);
    if (!match) {
      return [label];
    }
    const [, tense = '', voice = '', mood = ''] = match;
    const parts = [label, ...present(words.tense[tense], words.voice[voice], words.mood[mood])];
    if (/^[123][SP]$/.test(inflection)) {
      return [
        ...parts,
        words.person(inflection.slice(0, 1)),
        ...present(words.number[inflection.slice(1)]),
      ];
    }
    return [...parts, ...caseNumberGender(inflection, words)];
  }
  const [inflection = ''] = rest;
  if (/^[123][A-Z]{2}$/.test(inflection)) {
    // A personal pronoun: person, then case and number (`P-1NS`).
    return [
      label,
      words.person(inflection.slice(0, 1)),
      ...caseNumberGender(inflection.slice(1), words),
    ];
  }
  return [label, ...caseNumberGender(inflection, words)];
}

function describeHebrew(code: string, words: GrammarVocabulary): string[] {
  const language = code.slice(0, 1);
  const body = code.slice(1);
  const part = body.slice(0, 1);
  if (part === 'V') {
    const stems = language === 'A' ? words.aramaicStem : words.hebrewStem;
    const [, stem = '', aspect = '', ...inflection] = body;
    const participle = aspect === 'r' || aspect === 's';
    const [first = '', second = '', third = ''] = inflection;
    return present(
      words.hebrewParts.V,
      stems[stem],
      words.aspect[aspect],
      participle || first === '' ? undefined : words.person(first),
      ...(participle
        ? [words.gender[first], words.number[second], words.state[third]]
        : [words.gender[second], words.number[third]]),
    );
  }
  if (part === 'N' || part === 'A') {
    const kind = body.slice(0, 2);
    const label = words.hebrewParts[kind] ?? words.hebrewParts[part];
    if (kind === 'Np') {
      return present(label);
    }
    const [gender = '', number = '', state = ''] = body.slice(2);
    return present(label, words.gender[gender], words.number[number], words.state[state]);
  }
  return present(words.hebrewParts[part]);
}

/** A grammar code in words, e.g. `V-AAI-3S` → `verb, aorist, active, indicative, 3rd person, singular`. */
export function describeGrammar(code: string, localeId: LocaleId): string {
  if (code === '') {
    return '';
  }
  const words = vocabularyFor(localeId);
  const parts = /^[HA][A-Z]/.test(code) ? describeHebrew(code, words) : describeGreek(code, words);
  return parts.length > 0 ? parts.join(', ') : code;
}
