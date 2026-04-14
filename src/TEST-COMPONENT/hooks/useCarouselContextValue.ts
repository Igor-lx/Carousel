import { useMemo } from "react";

import type { CarouselContextValue } from "../model/context";
import type { MoveReason } from "../model/reducer";

interface UseCarouselContextValueProps {
  pageCount: number;
  activePageIndex: number;
  isMoving: boolean;
  isJumping: boolean;
  moveReason: MoveReason;
  actualDuration: number;
  handlePageSelect: (index: number) => void;
  handlePrev: () => void;
  handleNext: () => void;
  isAtStart: boolean;
  isAtEnd: boolean;
  isTouch: boolean;
  isReducedMotion: boolean;
}

export function useCarouselContextValue({
  pageCount,
  activePageIndex,
  isMoving,
  isJumping,
  moveReason,
  actualDuration,
  handlePageSelect,
  handlePrev,
  handleNext,
  isAtStart,
  isAtEnd,
  isTouch,
  isReducedMotion,
}: UseCarouselContextValueProps): CarouselContextValue {
  return useMemo(
    () => ({
      pageCount,
      activePageIndex,
      isMoving,
      isJumping,
      moveReason,
      actualDuration,
      handlePageSelect,
      handlePrev,
      handleNext,
      canMovePrev: !isAtStart,
      canMoveNext: !isAtEnd,
      isTouch,
      isReducedMotion,
    }),
    [
      pageCount,
      activePageIndex,
      isMoving,
      isJumping,
      moveReason,
      actualDuration,
      handlePageSelect,
      handlePrev,
      handleNext,
      isAtStart,
      isAtEnd,
      isTouch,
      isReducedMotion,
    ],
  );
}
