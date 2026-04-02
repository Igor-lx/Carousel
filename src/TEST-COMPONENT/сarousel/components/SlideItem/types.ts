import type { ClassNameMap, Slide } from "../../Carousel.types";

export interface SlideItemProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  "className"
> {
  isImg?: boolean;
  errAltPlaceholder: string;
  className: ClassNameMap;
  style: React.CSSProperties;
  slide: Slide;
  isInteractive?: boolean;
  isActive: boolean;
  isActual: boolean;
  onSlideClick?: (slide: Slide) => void;
}
