import { uiLanguage } from '../../locales/ui.ts';
const formats = (language: string) => ({
  integer: new Intl.NumberFormat(language),
  decimal: new Intl.NumberFormat(language, { maximumFractionDigits: 2 }),
  percent: new Intl.NumberFormat(language, { style: 'percent', maximumFractionDigits: 1 }),
});
const LOCALE_FORMATS = { en: formats('en-US'), sl: formats('sl-SI') };
export function formatInteger(value: number): string {
  return LOCALE_FORMATS[uiLanguage()].integer.format(value);
}

export function formatDecimal(value: number): string {
  return LOCALE_FORMATS[uiLanguage()].decimal.format(value);
}

/** Formats `part / whole` as a percentage; `—` when the whole is zero. */
export function formatShare(part: number, whole: number): string {
  return whole === 0 ? '—' : LOCALE_FORMATS[uiLanguage()].percent.format(part / whole);
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'] as const;
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${LOCALE_FORMATS[uiLanguage()].decimal.format(value)} ${units[unitIndex] ?? 'B'}`;
}

export function formatDuration(milliseconds: number): string {
  return milliseconds < 1000
    ? `${Math.round(milliseconds)} ms`
    : `${LOCALE_FORMATS[uiLanguage()].decimal.format(milliseconds / 1000)} s`;
}
