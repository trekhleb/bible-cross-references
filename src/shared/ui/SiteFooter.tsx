import type { ReactNode } from 'react';
import styles from './SiteFooter.module.css';

const YEAR = new Date().getFullYear();

interface SiteFooterProps {
  /** Page-specific credits, such as data attribution. */
  readonly children?: ReactNode;
  /** Extra class for page-specific spacing (CSS Modules class names may be undefined). */
  readonly className?: string | undefined;
}

/** The minimal site-wide footer: year and a link to the author's site, plus credits. */
export function SiteFooter({ children, className }: SiteFooterProps) {
  return (
    <footer className={className ? `${styles.footer} ${className}` : styles.footer}>
      <span className={styles.owner}>
        © {YEAR} · <a href="https://trekhleb.dev">trekhleb.dev</a>
      </span>
      {children !== undefined && <span className={styles.credits}>{children}</span>}
    </footer>
  );
}
