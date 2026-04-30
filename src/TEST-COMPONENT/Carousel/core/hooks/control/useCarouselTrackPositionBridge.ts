import {
  useCallback,
  useRef,
  type MutableRefObject,
  type RefObject,
} from "react";

import {
  type NumericMotionController,
  useIsomorphicLayoutEffect,
} from "../../../../../shared";
import { getTrackPositionStyle } from "../../utilities";
import type { CarouselMotionStrategy } from "../../model/motion-execution";

interface UseCarouselTrackPositionBridgeProps {
  trackRef: RefObject<HTMLDivElement | null>;
  renderWindowStart: number;
  visibleSlidesCount: number;
  motionController: NumericMotionController<CarouselMotionStrategy>;
}

interface UseCarouselTrackPositionBridgeResult {
  currentPositionRef: MutableRefObject<number>;
  positionReaderRef: MutableRefObject<() => number>;
  applyPosition: (position: number) => void;
  readCurrentPosition: () => number;
}

export function useCarouselTrackPositionBridge({
  trackRef,
  renderWindowStart,
  visibleSlidesCount,
  motionController,
}: UseCarouselTrackPositionBridgeProps): UseCarouselTrackPositionBridgeResult {
  const currentPositionRef = useRef(0);
  const positionReaderRef = useRef<() => number>(
    () => currentPositionRef.current,
  );

  const writeTrackPosition = useCallback(
    (position: number) => {
      currentPositionRef.current = position;

      const track = trackRef.current;
      if (!track) return;

      const trackStyle = getTrackPositionStyle(
        position,
        renderWindowStart,
        visibleSlidesCount,
      );

      track.style.transform = trackStyle.transform;
      track.style.transition = trackStyle.transition;
    },
    [currentPositionRef, trackRef, renderWindowStart, visibleSlidesCount],
  );

  useIsomorphicLayoutEffect(
    () =>
      motionController.subscribe(
        (sample) => {
          writeTrackPosition(sample.value);
        },
        { emitCurrent: true },
      ),
    [motionController, writeTrackPosition],
  );

  useIsomorphicLayoutEffect(() => {
    writeTrackPosition(currentPositionRef.current);
  }, [writeTrackPosition]);

  const applyPosition = useCallback(
    (position: number) => {
      motionController.set(position, {
        target: position,
        velocity: 0,
        strategy: "handoff",
      });
    },
    [motionController],
  );

  const readCurrentPosition = useCallback(() => {
    const position = positionReaderRef.current();

    return Number.isFinite(position) ? position : currentPositionRef.current;
  }, [currentPositionRef, positionReaderRef]);

  return {
    currentPositionRef,
    positionReaderRef,
    applyPosition,
    readCurrentPosition,
  };
}
