import { useCallback, useMemo, useRef, type RefObject } from "react";

import {
  motionEngine,
  useIsomorphicLayoutEffect,
  type NumericMotionController,
} from "../../../../shared";
import type { CarouselMotionStrategy } from "../model/motion-execution";
import { getShortestCyclicDistance } from "../utilities";
import {
  canBindCarouselMotionSource,
  isCarouselExternalControlHandle,
} from "./types";

interface UseCarouselExternalControlSyncProps {
  externalControlRef: RefObject<unknown | null>;
  motionController: NumericMotionController<CarouselMotionStrategy>;
  motionDuration: number;
  targetPageIndex: number;
  pageCount: number;
  isFinite: boolean;
  visualOffsetStepSize: number;
  shouldSyncMotion: boolean;
  shouldBindMotionSource: boolean;
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
  motionController,
  motionDuration,
  targetPageIndex,
  pageCount,
  isFinite,
  visualOffsetStepSize,
  shouldSyncMotion,
  shouldBindMotionSource,
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

  const motionValueSource = useMemo(
    () =>
      motionEngine.createMappedNumericMotionValueSource(
        motionController,
        (sample) => {
          if (!(visualOffsetStepSize > 0)) {
            return 0;
          }

          return sample.value / visualOffsetStepSize;
        },
      ),
    [motionController, visualOffsetStepSize],
  );

  useIsomorphicLayoutEffect(() => {
    const handle = getExternalControlHandle();

    if (!canBindCarouselMotionSource(handle) || !handle?.bindMotionSource) {
      return;
    }

    if (!shouldBindMotionSource) {
      handle.bindMotionSource(null);
      handle.setStopped?.(true);

      return () => {
        handle.setStopped?.(false);
      };
    }

    handle.setStopped?.(false);
    handle.bindMotionSource(motionValueSource);

    return () => {
      handle.bindMotionSource?.(null);
    };
  }, [getExternalControlHandle, motionValueSource, shouldBindMotionSource]);

  useIsomorphicLayoutEffect(() => {
    const handle = getExternalControlHandle();

    if (canBindCarouselMotionSource(handle)) {
      return;
    }

    handle?.setDuration(motionDuration);
  }, [getExternalControlHandle, motionDuration]);

  useIsomorphicLayoutEffect(() => {
    const previousTargetPageIndex = previousTargetPageIndexRef.current;
    previousTargetPageIndexRef.current = targetPageIndex;
    const handle = getExternalControlHandle();

    if (
      previousTargetPageIndex === null ||
      !shouldSyncMotion ||
      canBindCarouselMotionSource(handle)
    ) {
      return;
    }

    const direction = getExternalControlStepDirection({
      previousTargetPageIndex,
      nextTargetPageIndex: targetPageIndex,
      pageCount,
      isFinite,
    });

    if (direction > 0) {
      handle?.moveRight();
      return;
    }

    if (direction < 0) {
      handle?.moveLeft();
    }
  }, [
    getExternalControlHandle,
    isFinite,
    pageCount,
    shouldSyncMotion,
    targetPageIndex,
  ]);
}
