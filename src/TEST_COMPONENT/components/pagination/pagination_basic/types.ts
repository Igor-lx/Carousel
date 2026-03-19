import type { ClassNameMap, MoveReason } from "../../../types";

export type PaginationBasicProps = {
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

export type PaginationBasicDotProps = {
  idx: number;
  visualIndex: number;
  className: ClassNameMap;
  onDotClick: (idx: number) => void;
};
