import { useRef, type RefObject } from "react";

import { useIsomorphicLayoutEffect } from "../../shared";
import { getShortestDistance } from "../utilities";
import type { CarouselExternalController } from "./types";
import type { AnimationMode } from "../model/reducer";

interface ExternalControllerSyncProps {
  externalControllerRef: RefObject<CarouselExternalController | null>;
  isReducedMotion: boolean;
  actualDuration: number;
  targetIndex: number;
  pageCount: number;
  isFinite: boolean;
  animMode: AnimationMode;
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
  isReducedMotion,
  actualDuration,
  targetIndex,
  pageCount,
  isFinite,
  animMode,
}: ExternalControllerSyncProps): void {
  const previousTargetIndexRef = useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    externalControllerRef.current?.toggleFreezed(isReducedMotion);
  }, [isReducedMotion, externalControllerRef]);

  useIsomorphicLayoutEffect(() => {
    externalControllerRef.current?.setDuration(actualDuration);
  }, [actualDuration, externalControllerRef]);

  useIsomorphicLayoutEffect(() => {
    const previousTargetIndex = previousTargetIndexRef.current;
    previousTargetIndexRef.current = targetIndex;

    if (
      previousTargetIndex === null ||
      animMode === "none"
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
    animMode,
    externalControllerRef,
    isFinite,
    pageCount,
    targetIndex,
  ]);
}
