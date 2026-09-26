import type { Key, ReactNode } from 'react';
import styles from './DataTable.module.css';

export interface DataTableColumn<Row> {
  readonly header: string;
  readonly render: (row: Row) => ReactNode;
  /** Numbers read best right-aligned. */
  readonly align?: 'start' | 'end';
}

interface DataTableProps<Row> {
  readonly caption?: ReactNode;
  readonly columns: readonly DataTableColumn<Row>[];
  readonly rows: readonly Row[];
  readonly rowKey: (row: Row) => Key;
  readonly emptyMessage?: string;
}

export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  emptyMessage = 'Nothing to show.',
}: DataTableProps<Row>) {
  const alignment = (column: DataTableColumn<Row>) =>
    column.align === 'end' ? styles.end : undefined;
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        {caption !== undefined && <caption className={styles.caption}>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} scope="col" className={alignment(column)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => (
                  <td key={column.header} className={alignment(column)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
