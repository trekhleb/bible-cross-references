import type { ImportNotice } from '../../../src/core/datasets/formats.ts';

const MAX_EXAMPLES = 5;

/** Builds an import notice from the full list of affected items, keeping a few as examples. */
export function createNotice(
  level: ImportNotice['level'],
  message: string,
  affectedItems: readonly string[],
): ImportNotice {
  return {
    level,
    message,
    count: affectedItems.length,
    examples: affectedItems.slice(0, MAX_EXAMPLES),
  };
}
