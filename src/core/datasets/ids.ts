/**
 * Identifiers of the datasets the project knows about.
 *
 * Registries keyed by these IDs (`Record<TranslationId, …>`) make the compiler check that every
 * dataset has, for example, both a data-pipeline importer and a runtime manifest.
 */

export const TRANSLATION_IDS = ['bsb'] as const;
export type TranslationId = (typeof TRANSLATION_IDS)[number];

export const CROSS_REFERENCE_SOURCE_IDS = ['openbible'] as const;
export type CrossReferenceSourceId = (typeof CROSS_REFERENCE_SOURCE_IDS)[number];
