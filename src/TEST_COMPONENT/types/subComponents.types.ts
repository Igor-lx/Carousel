import type { ClassNameMap, Slide } from "./types";

export interface NavZoneProps {
  direction: "left" | "right";
  onClick: () => void;
  className: ClassNameMap;
}

export type ControlsProps = {
  isAtStart: boolean;
  isAtEnd: boolean;
  onPrev: () => void;
  onNext: () => void;
  className: ClassNameMap;
};

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
