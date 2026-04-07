import type { Slide, SlideItemClassMap } from "../../Carousel.types";

export interface SlideItemProps {
  isImg?: boolean;
  errAltPlaceholder?: string;
  style: React.CSSProperties;
  slide: Slide;
  isInteractive?: boolean;
  isActive?: boolean;
  isActual?: boolean;
  onSlideClick?: (slide: Slide) => void;
  className: SlideItemClassMap;
}
