import { selectedTranslation } from '../translations/selection.ts';
import { en } from './en.ts';
import { sl } from './sl/ui.ts';

export type UiLanguage = 'en' | 'sl';
export type MessageKey = keyof typeof en;
export function uiLanguage(): UiLanguage {
  return selectedTranslation().language === 'sl' ? 'sl' : 'en';
}
export function t(
  message: string,
  values: Readonly<Record<string, string | number>> = {},
  language = uiLanguage(),
): string {
  const catalog = language === 'sl' ? sl : en;
  const text = Object.hasOwn(catalog, message) ? catalog[message as MessageKey] : message;
  return text.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    values[key] === undefined ? placeholder : String(values[key]),
  );
}
export function connectionCount(count: number): string {
  const language = uiLanguage();
  const category = new Intl.PluralRules(language).select(count);
  return t(
    `connection.${category}`,
    { count: new Intl.NumberFormat(language).format(count) },
    language,
  );
}

export function verseCount(count: number): string {
  const language = uiLanguage();
  const category = new Intl.PluralRules(language).select(count);
  return t(`verse.${category}`, { count: new Intl.NumberFormat(language).format(count) }, language);
}
