import { useRef, type RefObject } from "react";

import { useIsomorphicLayoutEffect } from "../../shared";
import { getShortestDistance } from "../utilities";
import type { CarouselExternalController } from "./types";

interface ExternalControllerSyncProps {
  externalControllerRef: RefObject<CarouselExternalController | null>;
  actualDuration: number;
  targetIndex: number;
  pageCount: number;
  isFinite: boolean;
  shouldRotateWidget: boolean;
}

const getWidgetDirection = ({
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

export function useCarouselExternalControllerSync({
  externalControllerRef,
  actualDuration,
  targetIndex,
  pageCount,
  isFinite,
  shouldRotateWidget,
}: ExternalControllerSyncProps): void {
  const previousTargetIndexRef = useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    externalControllerRef.current?.setDuration(actualDuration);
  }, [actualDuration, externalControllerRef]);

  useIsomorphicLayoutEffect(() => {
    const previousTargetIndex = previousTargetIndexRef.current;
    previousTargetIndexRef.current = targetIndex;

    if (
      previousTargetIndex === null ||
      !shouldRotateWidget
    ) {
      return;
    }

    const direction = getWidgetDirection({
      previousTargetIndex,
      nextTargetIndex: targetIndex,
      pageCount,
      isFinite,
    });

    if (direction > 0) {
      externalControllerRef.current?.moveRight?.();
      return;
    }

    if (direction < 0) {
      externalControllerRef.current?.moveLeft?.();
    }
  }, [
    externalControllerRef,
    isFinite,
    pageCount,
    shouldRotateWidget,
    targetIndex,
  ]);
}
