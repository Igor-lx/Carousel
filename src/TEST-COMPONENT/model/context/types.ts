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
  isPaginationDynamic: boolean;
  moveReason: MoveReason;
  handleDotClick: (idx: number) => void;
}
