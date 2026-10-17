/**
 * Identifiers of the datasets the project knows about.
 *
 * Registries keyed by these IDs (`Record<TranslationId, …>`) make the compiler check that every
 * dataset has, for example, both a data-pipeline importer and a runtime manifest.
 */

export const TRANSLATION_IDS = ['bsb', 'kjv', 'chr1914-sl'] as const;
export type TranslationId = (typeof TRANSLATION_IDS)[number];

export const CROSS_REFERENCE_SOURCE_IDS = ['openbible'] as const;
export type CrossReferenceSourceId = (typeof CROSS_REFERENCE_SOURCE_IDS)[number];

export const WORD_SOURCE_IDS = ['stepbible'] as const;
export type WordSourceId = (typeof WORD_SOURCE_IDS)[number];

/** Whether a string from outside (a URL, a stored preference) names a translation. */
export function isTranslationId(value: string): value is TranslationId {
  return TRANSLATION_IDS.some((id) => id === value);
}
