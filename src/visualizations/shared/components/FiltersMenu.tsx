import { formatInteger } from '../../../shared/lib/format.ts';
import { FiltersIcon, ResetIcon } from '../../../shared/ui/icons.tsx';
import {
  describeThreshold,
  isDefaultFilter,
  VOTE_THRESHOLDS,
  type LinkFilter,
} from '../link-filter.ts';
import styles from './controls.module.css';
import { MenuButton } from './MenuButton.tsx';

interface FiltersMenuProps {
  readonly filter: LinkFilter;
  readonly defaults: LinkFilter;
  readonly onChange: (filter: LinkFilter) => void;
  /** Links currently shown, and in the whole dataset, so filtering is never hidden. */
  readonly shownLinks: number;
  readonly totalLinks: number;
}

function thresholdLabel(minVotes: number): string {
  if (minVotes === -Infinity) {
    return 'All links, including those voted down';
  }
  if (minVotes === 0) {
    return 'All but those voted down';
  }
  return minVotes === 1 ? 'At least 1 vote' : `At least ${minVotes} votes`;
}

/** Low-key link filters: a button that opens a small popover. */
export function FiltersMenu({
  filter,
  defaults,
  onChange,
  shownLinks,
  totalLinks,
}: FiltersMenuProps) {
  const isDefault = isDefaultFilter(filter, defaults);
  return (
    <MenuButton label="Filters" icon={FiltersIcon} indicator={!isDefault}>
      <label className={styles.field}>
        Community votes
        <select
          className={styles.select}
          value={String(filter.minVotes)}
          onChange={(event) => {
            onChange({ ...filter, minVotes: Number(event.target.value) });
          }}
        >
          {VOTE_THRESHOLDS.map((minVotes) => (
            <option key={minVotes} value={String(minVotes)}>
              {thresholdLabel(minVotes)}
            </option>
          ))}
        </select>
      </label>
      <p className={styles.hint}>
        Votes rank how helpful OpenBible.info readers found a link; they don’t prove it right or
        wrong. Showing {formatInteger(shownLinks)} of {formatInteger(totalLinks)} links (
        {describeThreshold(filter.minVotes)}
        {filter.hiddenGenres.size > 0 && `, ${filter.hiddenGenres.size} genres hidden`}).
      </p>
      <p className={styles.hint}>Tip: tap a genre in the legend to hide or show it.</p>
      <button
        type="button"
        className={styles.button}
        disabled={isDefault}
        onClick={() => {
          onChange(defaults);
        }}
      >
        <ResetIcon />
        Reset filters
      </button>
    </MenuButton>
  );
}
