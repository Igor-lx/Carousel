import type { MoveReason } from "../reducer";
import type { DevNoticeEntry } from "../../../../../shared";
import type { CarouselPerfectPageLayoutNoticeInput } from "../diagnostic";

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
  autoplayPaginationFactor: number;
}

export interface CarouselDiagnosticContextValue {
  correctionEntries: DevNoticeEntry[];
  perfectPageLayoutNoticeInput: CarouselPerfectPageLayoutNoticeInput;
}
