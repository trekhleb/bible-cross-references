/**
 * Maps community votes to a brightness in [0.2, 1]: disputed and unvoted links stay faint,
 * well-voted ones glow. Votes rank helpfulness, not correctness, so this is emphasis only.
 */
export function voteWeight(votes: number): number {
  const saturation = 2; // log10(100): 99+ votes are fully bright
  return Math.min(1, 0.2 + (0.8 * Math.log10(1 + Math.max(votes, 0))) / saturation);
}
