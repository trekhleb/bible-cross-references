import { describe, expect, it } from 'vitest';
import { describeGrammar } from './grammar.ts';

describe('describeGrammar', () => {
  it('reads a Greek finite verb', () => {
    expect(describeGrammar('V-AAI-3S', 'en')).toBe(
      'verb, aorist, active, indicative, 3rd person, singular',
    );
    expect(describeGrammar('V-AAI-3S', 'pl')).toBe(
      'czasownik, aoryst, strona czynna, tryb oznajmujący, 3 os., lp.',
    );
  });

  it('reads a Greek participle by its case, number and gender', () => {
    expect(describeGrammar('V-PAP-NSM', 'en')).toBe(
      'verb, present, active, participle, nominative, singular, masculine',
    );
  });

  it('reads Greek nouns, adjectives and personal pronouns', () => {
    expect(describeGrammar('A-NSM', 'pl')).toBe('przymiotnik, mianownik, lp., r. męski');
    expect(describeGrammar('N-GSF', 'en')).toBe('noun, genitive, singular, feminine');
    expect(describeGrammar('P-1NS', 'en')).toBe(
      'personal pronoun, 1st person, nominative, singular',
    );
    expect(describeGrammar('CONJ', 'pl')).toBe('spójnik');
  });

  it('reads a Hebrew verb by its stem, aspect, person, gender and number', () => {
    expect(describeGrammar('HVqp3ms', 'en')).toBe(
      'verb, qal, perfect, 3rd person, masculine, singular',
    );
    expect(describeGrammar('HVqp3ms', 'pl')).toBe(
      'czasownik, qal, perfectum, 3 os., r. męski, lp.',
    );
  });

  it('reads a Hebrew participle and an Aramaic stem', () => {
    expect(describeGrammar('HVqrmsa', 'en')).toBe(
      'verb, qal, active participle, masculine, singular, absolute',
    );
    expect(describeGrammar('AVhp3ms', 'en')).toBe(
      'verb, haphel, perfect, 3rd person, masculine, singular',
    );
  });

  it('reads Hebrew nouns, names and particles', () => {
    expect(describeGrammar('HNcfsa', 'pl')).toBe('rzeczownik, r. żeński, lp., stan absolutny');
    expect(describeGrammar('HNpm', 'en')).toBe('proper noun');
    expect(describeGrammar('HTd', 'en')).toBe('particle');
  });

  it('shows a code it cannot read as it is, and nothing for no code', () => {
    expect(describeGrammar('ZZZ', 'en')).toBe('ZZZ');
    expect(describeGrammar('', 'en')).toBe('');
  });
});
