import { Fragment, type ReactNode } from 'react';
import styles from './KeyValueList.module.css';

export interface KeyValueItem {
  readonly label: string;
  readonly value: ReactNode;
}

interface KeyValueListProps {
  readonly items: readonly KeyValueItem[];
}

export function KeyValueList({ items }: KeyValueListProps) {
  return (
    <dl className={styles.list}>
      {items.map(({ label, value }) => (
        <Fragment key={label}>
          <dt className={styles.term}>{label}</dt>
          <dd className={styles.value}>{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
