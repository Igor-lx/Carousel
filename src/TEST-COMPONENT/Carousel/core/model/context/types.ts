import type { MoveReason } from "../reducer";
import type { CarouselNormalizationInput } from "../normalization";
import type { DevNoticeEntry } from "../../../../../shared";

export interface CarouselModuleApi {
  pageCount: number;
  activePageIndex: number;
  isMoving: boolean;
  isJumping: boolean;
  moveReason: MoveReason;
  motionDuration: number;
  handlePrev: () => void;
  handleNext: () => void;
  handlePageSelect: (index: number) => void;
  canMovePrev: boolean;
  canMoveNext: boolean;
  isTouch: boolean;
  isReducedMotion: boolean;
}

export interface CarouselNormalizationContextValue {
  rawNormalizationInput: CarouselNormalizationInput;
  layoutNoticeEntries: DevNoticeEntry[];
}
