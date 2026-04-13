import type { MoveReason } from "../reducer";

export interface CarouselContextValue {
  pageCount: number;
  activeDotIndex: number;
  isMoving: boolean;
  isJumping: boolean;
  actualDuration: number;
  moveReason: MoveReason;
  handlePrev: () => void;
  handleNext: () => void;
  handleDotClick: (index: number) => void;
  showAtStart: boolean;
  showAtEnd: boolean;
  isTouch: boolean;
  isReducedMotion: boolean;
}
