import type { ImportNotice } from '../../../core/datasets/formats.ts';
import { formatInteger } from '../../../shared/lib/format.ts';
import styles from '../DebugPage.module.css';

interface NoticeListProps {
  readonly notices: readonly ImportNotice[];
}

/** What the data pipeline noticed or changed while importing a dataset. */
export function NoticeList({ notices }: NoticeListProps) {
  if (notices.length === 0) {
    return <p className={styles.muted}>No import notices.</p>;
  }
  return (
    <ul className={styles.notices}>
      {notices.map((notice) => (
        <li key={notice.message} className={styles.notice} data-level={notice.level}>
          <strong>{notice.level}</strong> · {notice.message} ({formatInteger(notice.count)})
          {notice.examples.length > 0 && (
            <div className={styles.muted}>
              e.g. <code>{notice.examples.join(' · ')}</code>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
