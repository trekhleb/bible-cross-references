/** Positions of the `k` largest positive values, largest first (ties: lower position first). */
export function topPositions(values: ArrayLike<number>, k: number): number[] {
  const positions: number[] = [];
  for (let position = 0; position < values.length; position += 1) {
    if ((values[position] ?? 0) > 0) {
      positions.push(position);
    }
  }
  return positions.sort((a, b) => (values[b] ?? 0) - (values[a] ?? 0) || a - b).slice(0, k);
}
