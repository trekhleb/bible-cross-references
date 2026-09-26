import type { ReactNode } from 'react';
import styles from './Section.module.css';

interface SectionProps {
  readonly id: string;
  readonly title: string;
  readonly description?: ReactNode;
  readonly children: ReactNode;
}

export function Section({ id, title, description, children }: SectionProps) {
  const titleId = `${id}-title`;
  return (
    <section id={id} className={styles.section} aria-labelledby={titleId}>
      <header className={styles.header}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {description !== undefined && <p className={styles.description}>{description}</p>}
      </header>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
