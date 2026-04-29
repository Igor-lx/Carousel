import { useRef, type RefObject } from "react";

import { useIsomorphicLayoutEffect } from "../../../../shared";
import { getShortestCyclicDistance } from "../utilities";
import type { CarouselExternalControlHandle } from "./types";

interface UseCarouselExternalControlSyncProps {
  externalControlRef: RefObject<CarouselExternalControlHandle | null>;
  motionDuration: number;
  targetPageIndex: number;
  pageCount: number;
  isFinite: boolean;
  shouldSyncMotion: boolean;
}

const getExternalControlStepDirection = ({
  previousTargetPageIndex,
  nextTargetPageIndex,
  pageCount,
  isFinite,
}: {
  previousTargetPageIndex: number;
  nextTargetPageIndex: number;
  pageCount: number;
  isFinite: boolean;
}) => {
  if (previousTargetPageIndex === nextTargetPageIndex || pageCount <= 1) {
    return 0;
  }

  if (isFinite) {
    return Math.sign(nextTargetPageIndex - previousTargetPageIndex);
  }

  return Math.sign(
    getShortestCyclicDistance(
      previousTargetPageIndex,
      nextTargetPageIndex,
      pageCount,
    ),
  );
};

export function useCarouselExternalControlSync({
  externalControlRef,
  motionDuration,
  targetPageIndex,
  pageCount,
  isFinite,
  shouldSyncMotion,
}: UseCarouselExternalControlSyncProps): void {
  const previousTargetPageIndexRef = useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    externalControlRef.current?.setDuration(motionDuration);
  }, [motionDuration, externalControlRef]);

  useIsomorphicLayoutEffect(() => {
    const previousTargetPageIndex = previousTargetPageIndexRef.current;
    previousTargetPageIndexRef.current = targetPageIndex;

    if (previousTargetPageIndex === null || !shouldSyncMotion) {
      return;
    }

    const direction = getExternalControlStepDirection({
      previousTargetPageIndex,
      nextTargetPageIndex: targetPageIndex,
      pageCount,
      isFinite,
    });

    if (direction > 0) {
      externalControlRef.current?.moveRight?.();
      return;
    }

    if (direction < 0) {
      externalControlRef.current?.moveLeft?.();
    }
  }, [
    externalControlRef,
    isFinite,
    pageCount,
    shouldSyncMotion,
    targetPageIndex,
  ]);
}
