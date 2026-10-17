import { t } from '../../../locales/ui.ts';
import { useId } from 'react';
import type { TranslationId } from '../../../core/datasets/ids.ts';
import { TRANSLATION_MANIFESTS } from '../../../translations/registry.ts';
import type { TranslationManifest } from '../../../translations/translation-manifest.ts';
import styles from './controls.module.css';
import { MenuButton } from './MenuButton.tsx';

interface TranslationMenuProps {
  readonly current: TranslationManifest;
  readonly onChange: (id: TranslationId) => void;
  /** True while the chosen text is still downloading. */
  readonly pending?: boolean;
  /** Why the last choice did not take effect, if it did not. */
  readonly error?: string | null;
}

/**
 * Chooses the translation the verses are shown in. The button wears the abbreviation rather than
 * the word "Translation": it is shorter, it is what a reader looks for, and it says at a glance
 * which text is on screen. The licence of the chosen text is in the menu, where it is chosen.
 */
export function TranslationMenu({
  current,
  onChange,
  pending = false,
  error = null,
}: TranslationMenuProps) {
  // Both visualizations stay mounted, so each one's radios need a group name of their own.
  const group = useId();
  const languages = [...new Set(TRANSLATION_MANIFESTS.map(({ language }) => language))];
  return (
    <MenuButton label={t('Bible translation')} value={current.abbreviation} busy={pending}>
      <div className={styles.field} role="radiogroup" aria-label={t('Bible translation')}>
        {languages.map((language) => {
          const nativeName =
            new Intl.DisplayNames([language], { type: 'language' }).of(language) ?? language;
          const heading = nativeName.charAt(0).toLocaleUpperCase(language) + nativeName.slice(1);
          return (
            <fieldset key={language} className={styles.translationGroup} lang={language}>
              <legend className={styles.translationLanguage}>{heading}</legend>
              {TRANSLATION_MANIFESTS.filter((translation) => translation.language === language).map(
                (translation) => (
                  <label key={translation.id} className={styles.choice}>
                    <input
                      type="radio"
                      name={group}
                      value={translation.id}
                      checked={translation.id === current.id}
                      onChange={() => {
                        onChange(translation.id);
                      }}
                    />
                    {translation.name}
                    <span className={styles.choiceAbbreviation}>{translation.abbreviation}</span>
                  </label>
                ),
              )}
            </fieldset>
          );
        })}
      </div>
      {error !== null && (
        <p role="alert" className={styles.menuError}>
          {error} {t('Check your connection and try again.')}
        </p>
      )}
      <p className={styles.hint}>{t(current.attribution)}</p>
    </MenuButton>
  );
}
