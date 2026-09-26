import type { AnchorHTMLAttributes } from 'react';

interface InAppLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick'> {
  readonly href: string;
  /** Navigates in place, instead of loading the page again. */
  readonly onFollow: () => void;
}

/**
 * A real link, so it can still be opened in a new tab or copied, that navigates in place on a
 * plain click.
 */
export function InAppLink({ onFollow, ...anchor }: InAppLinkProps) {
  return (
    <a
      {...anchor}
      onClick={(event) => {
        const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
        if (event.defaultPrevented || event.button !== 0 || modified) {
          return;
        }
        event.preventDefault();
        onFollow();
      }}
    />
  );
}
