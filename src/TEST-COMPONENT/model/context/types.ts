import type { MoveReason } from "../reducer";

export interface CarouselExternalController {
  moveRight: () => void;
  moveLeft: () => void;
}

export interface CarouselContextValue {
  pageCount: number;
  activeDotIndex: number;
  isMoving: boolean;
  isJumping: boolean;
  actualSpeed: number;
  moveReason: MoveReason;
  isPaginationDynamic: boolean;
  handlePrev: () => void;
  handleNext: () => void;
  handleDotClick: (index: number) => void;
  isAtStart: boolean;
  isAtEnd: boolean;
  isTouch: boolean;
}
