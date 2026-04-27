import type { MoveReason } from "../reducer";
import type { DevNoticeEntry } from "../../../../../shared";
import type {
  CarouselPerfectPageLayoutNoticeInput,
  CarouselSlotAttachmentNoticeInput,
} from "../diagnostic";

export interface CarouselModuleContextValue {
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
  slotAttachmentNoticeInput: CarouselSlotAttachmentNoticeInput;
}
