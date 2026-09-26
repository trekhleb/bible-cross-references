/**
 * Returns the element at `index`, throwing if it does not exist.
 *
 * Use it where an element must exist by construction (e.g. validated indices into typed arrays),
 * so that a violated invariant fails loudly instead of propagating `undefined`.
 */
export function elementAt<T>(array: ArrayLike<T>, index: number): T {
  const value = array[index];
  if (value === undefined) {
    throw new RangeError(`Index ${index} is out of bounds (length ${array.length}).`);
  }
  return value;
}
