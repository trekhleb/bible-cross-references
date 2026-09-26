const integerFormat = new Intl.NumberFormat('en-US');
const decimalFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const percentFormat = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 1,
});

export function formatInteger(value: number): string {
  return integerFormat.format(value);
}

export function formatDecimal(value: number): string {
  return decimalFormat.format(value);
}

/** Formats `part / whole` as a percentage; `—` when the whole is zero. */
export function formatShare(part: number, whole: number): string {
  return whole === 0 ? '—' : percentFormat.format(part / whole);
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'] as const;
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${decimalFormat.format(value)} ${units[unitIndex] ?? 'B'}`;
}

export function formatDuration(milliseconds: number): string {
  return milliseconds < 1000
    ? `${Math.round(milliseconds)} ms`
    : `${decimalFormat.format(milliseconds / 1000)} s`;
}
