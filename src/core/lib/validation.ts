/**
 * Minimal runtime validation for untrusted JSON (dataset files, config files).
 *
 * Each `expect*` function returns the value narrowed to the expected type or throws a
 * `ValidationError` that names the offending path, e.g. `links.votes[12]`.
 */

export class ValidationError extends Error {
  readonly path: string;

  constructor(path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = 'ValidationError';
    this.path = path;
  }
}

export type UnknownRecord = Readonly<Record<string, unknown>>;

function describe(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  return Array.isArray(value) ? 'array' : typeof value;
}

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function expectRecord(value: unknown, path: string): UnknownRecord {
  if (!isRecord(value)) {
    throw new ValidationError(path, `expected an object, got ${describe(value)}`);
  }
  return value;
}

export function expectString(value: unknown, path: string): string {
  if (typeof value !== 'string') {
    throw new ValidationError(path, `expected a string, got ${describe(value)}`);
  }
  return value;
}

export function expectNullableString(value: unknown, path: string): string | null {
  return value === null ? null : expectString(value, path);
}

export function expectInteger(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ValidationError(path, `expected an integer, got ${describe(value)}`);
  }
  return value;
}

export function expectOneOf<const T extends string | number>(
  value: unknown,
  allowed: readonly T[],
  path: string,
): T {
  const match = allowed.find((candidate) => candidate === value);
  if (match === undefined) {
    throw new ValidationError(
      path,
      `expected one of ${allowed.map((item) => JSON.stringify(item)).join(', ')}, got ${JSON.stringify(value)}`,
    );
  }
  return match;
}

export function expectArray(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) {
    throw new ValidationError(path, `expected an array, got ${describe(value)}`);
  }
  return value;
}

export function expectArrayOf<T>(
  value: unknown,
  path: string,
  expectItem: (item: unknown, itemPath: string) => T,
): T[] {
  return expectArray(value, path).map((item, index) => expectItem(item, `${path}[${index}]`));
}

function isStringArray(value: readonly unknown[]): value is readonly string[] {
  return value.every((item) => typeof item === 'string');
}

function isIntegerArray(value: readonly unknown[]): value is readonly number[] {
  return value.every((item) => typeof item === 'number' && Number.isInteger(item));
}

/** Validates a (possibly very large) array of strings without copying it. */
export function expectStringArray(value: unknown, path: string): readonly string[] {
  const array = expectArray(value, path);
  if (!isStringArray(array)) {
    const index = array.findIndex((item) => typeof item !== 'string');
    throw new ValidationError(`${path}[${index}]`, 'expected a string');
  }
  return array;
}

/** Validates a (possibly very large) array of integers without copying it. */
export function expectIntegerArray(value: unknown, path: string): readonly number[] {
  const array = expectArray(value, path);
  if (!isIntegerArray(array)) {
    const index = array.findIndex((item) => typeof item !== 'number' || !Number.isInteger(item));
    throw new ValidationError(`${path}[${index}]`, 'expected an integer');
  }
  return array;
}
