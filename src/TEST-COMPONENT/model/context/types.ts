import type { MoveReason } from "../reducer";

export interface CarouselContextValue {
  pageCount: number;
  activePageIndex: number;
  isMoving: boolean;
  isJumping: boolean;
  moveReason: MoveReason;
  actualDuration: number;
  handlePrev: () => void;
  handleNext: () => void;
  handlePageSelect: (index: number) => void;
  canMovePrev: boolean;
  canMoveNext: boolean;
  isTouch: boolean;
  isReducedMotion: boolean;
}
