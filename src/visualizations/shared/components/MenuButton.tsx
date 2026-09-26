import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import type { IconComponent } from '../../../shared/ui/icons.tsx';
import styles from './controls.module.css';

interface MenuButtonProps {
  readonly label: string;
  /** Shown next to the label, and alone on phones. */
  readonly icon: IconComponent;
  /** Shows a small dot on the button, e.g. when the menu's settings differ from the defaults. */
  readonly indicator?: boolean;
  /** The popover's content. */
  readonly children: ReactNode;
}

/** Space kept between an open popover and the edges of the viewport (matches `.popover`). */
const VIEWPORT_MARGIN_PX = 12;

/**
 * The popover hangs from the button's end edge, which can push it past the viewport on narrow
 * screens; this slides it back just enough to fit.
 */
function keepInViewport(popover: HTMLElement): void {
  popover.style.translate = '';
  const { left, right } = popover.getBoundingClientRect();
  const maxRight = document.documentElement.clientWidth - VIEWPORT_MARGIN_PX;
  const shift =
    left < VIEWPORT_MARGIN_PX ? VIEWPORT_MARGIN_PX - left : Math.min(maxRight - right, 0);
  popover.style.translate = shift === 0 ? '' : `${shift}px 0`;
}

/** A header button that opens a small popover; closes on outside click or Escape. */
export function MenuButton({ label, icon: Icon, indicator = false, children }: MenuButtonProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const closeOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  // Before paint, so the popover never flashes at its clipped position.
  useLayoutEffect(() => {
    const popover = popoverRef.current;
    if (!open || !popover) {
      return undefined;
    }
    const place = () => {
      keepInViewport(popover);
    };
    place();
    window.addEventListener('resize', place);
    return () => {
      window.removeEventListener('resize', place);
    };
  }, [open]);

  return (
    <div ref={menuRef} className={styles.menu}>
      <button
        type="button"
        className={`${styles.button} ${styles.menuButton}`}
        // Named explicitly: on phones the label is hidden and only the icon shows.
        aria-label={indicator ? `${label} (changed)` : label}
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        <Icon />
        <span className={styles.menuLabel}>{label}</span>
        {indicator && <span className={styles.indicator} />}
      </button>
      {open && (
        <div ref={popoverRef} id={popoverId} className={styles.popover}>
          {children}
        </div>
      )}
    </div>
  );
}
