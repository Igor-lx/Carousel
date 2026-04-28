import {
  useCallback,
  useRef,
  type MutableRefObject,
  type RefObject,
} from "react";

import { applyTrackPositionStyle } from "../../utilities";

interface UseCarouselTrackPositionBridgeProps {
  trackRef: RefObject<HTMLDivElement | null>;
  windowStart: number;
  visibleSlidesCount: number;
}

interface UseCarouselTrackPositionBridgeResult {
  currentPositionRef: MutableRefObject<number>;
  positionReaderRef: MutableRefObject<() => number>;
  applyPosition: (position: number) => void;
  readCurrentPosition: () => number;
}

export function useCarouselTrackPositionBridge({
  trackRef,
  windowStart,
  visibleSlidesCount,
}: UseCarouselTrackPositionBridgeProps): UseCarouselTrackPositionBridgeResult {
  const currentPositionRef = useRef(0);
  const positionReaderRef = useRef<() => number>(
    () => currentPositionRef.current,
  );

  const applyPosition = useCallback(
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
    currentPositionRef,
    positionReaderRef,
    applyPosition,
    readCurrentPosition,
  };
}
