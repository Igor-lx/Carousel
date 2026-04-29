import { useCallback, useRef, type RefObject } from "react";

import { useIsomorphicLayoutEffect } from "../../../../shared";
import { getShortestCyclicDistance } from "../utilities";
import { isCarouselExternalControlHandle } from "./types";

interface UseCarouselExternalControlSyncProps {
  externalControlRef: RefObject<unknown | null>;
  motionDuration: number;
  targetPageIndex: number;
  pageCount: number;
  isFinite: boolean;
  shouldSyncMotion: boolean;
  shouldReportInvalidHandle: boolean;
}

const INVALID_EXTERNAL_CONTROL_HANDLE_MESSAGE =
  "Carousel external control: Invalid ref handle. The selected child must expose " +
  "moveRight, moveLeft, and setDuration.";

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
  shouldReportInvalidHandle,
}: UseCarouselExternalControlSyncProps): void {
  const previousTargetPageIndexRef = useRef<number | null>(null);
  const lastReportedInvalidHandleRef = useRef<unknown | null>(null);

  const getExternalControlHandle = useCallback(() => {
    const candidate = externalControlRef.current;

    if (candidate === null) {
      lastReportedInvalidHandleRef.current = null;
      return null;
    }

    if (isCarouselExternalControlHandle(candidate)) {
      lastReportedInvalidHandleRef.current = null;
      return candidate;
    }

    if (
      import.meta.env.DEV &&
      shouldReportInvalidHandle &&
      lastReportedInvalidHandleRef.current !== candidate
    ) {
      lastReportedInvalidHandleRef.current = candidate;
      console.warn(INVALID_EXTERNAL_CONTROL_HANDLE_MESSAGE, candidate);
    }

    return null;
  }, [externalControlRef, shouldReportInvalidHandle]);

  useIsomorphicLayoutEffect(() => {
    getExternalControlHandle()?.setDuration(motionDuration);
  }, [getExternalControlHandle, motionDuration]);

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
      getExternalControlHandle()?.moveRight();
      return;
    }

    if (direction < 0) {
      getExternalControlHandle()?.moveLeft();
    }
  }, [
    getExternalControlHandle,
    isFinite,
    pageCount,
    shouldSyncMotion,
    targetPageIndex,
  ]);
}
