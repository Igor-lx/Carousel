import type { MoveReason } from "../../Carousel/types";

export interface PaginationBasicClassMap {
  readonly paginationWrapper?: string;
  readonly dot?: string;
  readonly dotActive?: string;
}

export type PaginationBasicProps = {
  pageCount: number;
  activeDotIndex: number;
  onDotClick: (idx: number) => void;
  className: PaginationBasicClassMap;
  isDynamic: boolean;
  isMoving: boolean;
  isJump: boolean;
  moveReason: MoveReason;
  speed: number;
};

export type PaginationBasicDotProps = {
  idx: number;
  visualIndex: number;
  className: PaginationBasicClassMap;
  onDotClick: (idx: number) => void;
};
