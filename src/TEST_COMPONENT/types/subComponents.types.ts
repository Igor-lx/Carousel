import type { MoveReason } from "./reducer.types";
import type { ClassNameMap, Slide } from "./types";

export type PaginationProps = {
  pageCount: number;
  activeDotIndex: number;
  onDotClick: (idx: number) => void;
  className: ClassNameMap;
  isDynamic: boolean;
  isMoving: boolean;
  isJump: boolean;
  moveReason: MoveReason;
  speed: number;
};

export type PaginationDotProps = {
  idx: number;
  visualIndex: number;
  className: ClassNameMap;
  onDotClick: (idx: number) => void;
};

export interface NavZoneProps {
  direction: "left" | "right";
  onClick: () => void;
  className: ClassNameMap;
}

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
