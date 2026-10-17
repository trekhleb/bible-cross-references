import { t } from '../../../locales/ui.ts';
import type { IconComponent } from '../../../shared/ui/icons.tsx';
import styles from './controls.module.css';

export interface SegmentedOption<Value extends string> {
  readonly value: Value;
  readonly label: string;
  /** Makes the option recognizable at a glance. */
  readonly icon?: IconComponent;
}

interface SegmentedControlProps<Value extends string> {
  readonly label: string;
  readonly options: readonly SegmentedOption<Value>[];
  readonly value: Value;
  readonly onChange: (value: Value) => void;
  /** Below 64rem, show only the options' icons, where header space is tight. */
  readonly iconsOnlyWhenNarrow?: boolean;
}

/** A compact group of mutually exclusive toggle buttons. */
export function SegmentedControl<Value extends string>({
  label,
  options,
  value,
  onChange,
  iconsOnlyWhenNarrow = false,
}: SegmentedControlProps<Value>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={styles.segmented}
      data-icons-only-when-narrow={iconsOnlyWhenNarrow}
    >
      {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
        <button
          key={optionValue}
          type="button"
          className={styles.button}
          // Named explicitly, since the label may be hidden; the tooltip says it on a pointer.
          aria-label={t(optionLabel)}
          title={iconsOnlyWhenNarrow ? t(optionLabel) : undefined}
          aria-pressed={optionValue === value}
          onClick={() => {
            onChange(optionValue);
          }}
        >
          {Icon && <Icon />}
          <span className={styles.optionLabel}>{t(optionLabel)}</span>
        </button>
      ))}
    </div>
  );
}
