import { useRef, type RefObject } from "react";

import { useIsomorphicLayoutEffect } from "../../../../shared";
import { getShortestDistance } from "../utilities";
import type { CarouselExternalControlHandle } from "./types";

interface ExternalControlSyncProps {
  externalControlRef: RefObject<CarouselExternalControlHandle | null>;
  motionDuration: number;
  targetIndex: number;
  pageCount: number;
  isFinite: boolean;
  shouldSyncMotion: boolean;
}

const getExternalControlStepDirection = ({
  previousTargetIndex,
  nextTargetIndex,
  pageCount,
  isFinite,
}: {
  previousTargetIndex: number;
  nextTargetIndex: number;
  pageCount: number;
  isFinite: boolean;
}) => {
  if (previousTargetIndex === nextTargetIndex || pageCount <= 1) {
    return 0;
  }

  if (isFinite) {
    return Math.sign(nextTargetIndex - previousTargetIndex);
  }

  return Math.sign(
    getShortestDistance(previousTargetIndex, nextTargetIndex, pageCount),
  );
};

export function useCarouselExternalControlSync({
  externalControlRef,
  motionDuration,
  targetIndex,
  pageCount,
  isFinite,
  shouldSyncMotion,
}: ExternalControlSyncProps): void {
  const previousTargetIndexRef = useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    externalControlRef.current?.setDuration(motionDuration);
  }, [motionDuration, externalControlRef]);

  useIsomorphicLayoutEffect(() => {
    const previousTargetIndex = previousTargetIndexRef.current;
    previousTargetIndexRef.current = targetIndex;

    if (previousTargetIndex === null || !shouldSyncMotion) {
      return;
    }

    const direction = getExternalControlStepDirection({
      previousTargetIndex,
      nextTargetIndex: targetIndex,
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
    targetIndex,
  ]);
}
