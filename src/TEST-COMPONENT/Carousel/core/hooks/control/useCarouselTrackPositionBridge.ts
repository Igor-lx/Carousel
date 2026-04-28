import { useCallback, type MutableRefObject, type RefObject } from "react";

import { applyTrackPositionStyle } from "../../utilities";

interface UseCarouselTrackPositionBridgeProps {
  trackRef: RefObject<HTMLDivElement | null>;
  currentPositionRef: MutableRefObject<number>;
  positionReaderRef: MutableRefObject<() => number>;
  windowStart: number;
  visibleSlidesCount: number;
}

interface UseCarouselTrackPositionBridgeResult {
  applyDragPosition: (position: number) => void;
  readCurrentPosition: () => number;
}

export function useCarouselTrackPositionBridge({
  trackRef,
  currentPositionRef,
  positionReaderRef,
  windowStart,
  visibleSlidesCount,
}: UseCarouselTrackPositionBridgeProps): UseCarouselTrackPositionBridgeResult {
  const applyDragPosition = useCallback(
    (position: number) => {
      currentPositionRef.current = position;

      const track = trackRef.current;
      if (!track) return;

      applyTrackPositionStyle(
        track,
        position,
        windowStart,
        visibleSlidesCount,
      );
    },
    [currentPositionRef, trackRef, visibleSlidesCount, windowStart],
  );

  const readCurrentPosition = useCallback(
    () => positionReaderRef.current(),
    [positionReaderRef],
  );

  return {
    applyDragPosition,
    readCurrentPosition,
  };
}
