import styles from './Bar.module.css';

interface BarProps {
  readonly value: number;
  readonly max: number;
  readonly label: string;
}

/** A small horizontal bar for inline, table-friendly distributions. */
export function Bar({ value, max, label }: BarProps) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className={styles.track} role="img" aria-label={label}>
      <div className={styles.fill} style={{ inlineSize: `${percent}%` }} />
    </div>
  );
}
