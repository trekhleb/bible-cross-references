import type { ReactElement } from 'react';
import type { IconType } from 'react-icons';
import {
  LuArrowLeft,
  LuArrowRight,
  LuArrowRightLeft,
  LuBookOpenText,
  LuChevronDown,
  LuChevronLeft,
  LuChevronRight,
  LuHand,
  LuMouse,
  LuMousePointerClick,
  LuPalette,
  LuRainbow,
  LuRefreshCw,
  LuRotateCcw,
  LuSearch,
  LuSlidersHorizontal,
  LuX,
} from 'react-icons/lu';
import { MdOutlinePinch, MdOutlineSwipeVertical, MdOutlineTouchApp } from 'react-icons/md';
import styles from './icons.module.css';

interface IconProps {
  readonly className?: string | undefined;
}

/** An icon, as components that show one accept it. */
export type IconComponent = (props: IconProps) => ReactElement;

/**
 * Wraps a glyph as a decorative icon: sized to the text around it and hidden from assistive
 * technology, because that text, or the accessible name of its control, already says what it
 * means.
 */
function decorative(Glyph: IconType): IconComponent {
  return function DecorativeIcon({ className }: IconProps) {
    return (
      <Glyph
        aria-hidden
        className={className === undefined ? styles.icon : `${styles.icon} ${className}`}
      />
    );
  };
}

// One icon family (Lucide) across the UI, with a single exception below. Names say what an icon
// means, not what it depicts, so changing a glyph, or the whole family, touches only this file.

// Visualizations: arcs over the whole Bible, and reading a chapter with its threads.
export const ArcsIcon = decorative(LuRainbow);
export const ReadingIcon = decorative(LuBookOpenText);

// Navigation
export const PreviousIcon = decorative(LuChevronLeft);
export const NextIcon = decorative(LuChevronRight);
export const ExpandIcon = decorative(LuChevronDown);
export const CloseIcon = decorative(LuX);

// Actions
export const SearchIcon = decorative(LuSearch);
export const ResetIcon = decorative(LuRotateCcw);
export const RetryIcon = decorative(LuRefreshCw);

// Gestures. A mouse's are Lucide's; Lucide has no touch gestures, so those come from Material
// Design Icons (outlined, which sits well beside Lucide's strokes), one family for all of them.
export const ScrollIcon = decorative(LuMouse);
export const DragIcon = decorative(LuHand);
export const ClickIcon = decorative(LuMousePointerClick);
export const TapIcon = decorative(MdOutlineTouchApp);
export const HoldAndSlideIcon = decorative(MdOutlineSwipeVertical);
export const PinchIcon = decorative(MdOutlinePinch);

// Settings
export const FiltersIcon = decorative(LuSlidersHorizontal);
export const GenresIcon = decorative(LuPalette);

// Link direction: a passage points to others, others point to it, or both. The arrows follow the
// reading-threads layout, where the text is on the left and the rest of the Bible on the right.
export const OutgoingIcon = decorative(LuArrowRight);
export const IncomingIcon = decorative(LuArrowLeft);
export const BothDirectionsIcon = decorative(LuArrowRightLeft);
