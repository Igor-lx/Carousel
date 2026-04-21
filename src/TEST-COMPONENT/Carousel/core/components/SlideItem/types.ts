import type { Slide, SlideItemClassMap } from "../../types";

export interface SlideItemProps {
  isContentImg?: boolean;
  errAltPlaceholder?: string;
  style: React.CSSProperties;
  slideData: Slide | null | undefined;
  isInteractive?: boolean;
  isActive?: boolean;
  isActual?: boolean;
  onSlideClick?: (slideData: Slide) => void;
  className: SlideItemClassMap;
}
