import {
  useCallback,
  useRef,
  type MutableRefObject,
  type RefObject,
} from "react";

import { getTrackPositionStyle } from "../../utilities";

interface UseCarouselTrackPositionBridgeProps {
  trackRef: RefObject<HTMLDivElement | null>;
  renderWindowStart: number;
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
  renderWindowStart,
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
