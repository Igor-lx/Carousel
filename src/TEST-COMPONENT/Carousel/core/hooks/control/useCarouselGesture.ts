import { useCallback, type RefObject } from "react";
import type { CarouselDragConfig } from "../../model/diagnostic";
import {
  type DragEngineListeners,
  type DragEngineMovePayload,
  type DragEngineReleasePayload,
  useDragEngine,
} from "../../../../../shared/touch-input";

interface UseCarouselGestureProps {
  startDrag: () => void;
  updateDrag: (dragOffset: number) => void;
  finishDrag: (payload: DragEngineReleasePayload) => void;
  enabled: boolean;
  dragConfig: CarouselDragConfig;
  measureRef: RefObject<HTMLDivElement | null>;
}

interface UseCarouselGestureResult {
  isDragging: boolean;
  isInteracting: boolean;
  dragListeners: DragEngineListeners;
}

export function useCarouselGesture({
  startDrag,
  updateDrag,
  finishDrag,
  enabled,
  dragConfig,
  measureRef,
}: UseCarouselGestureProps): UseCarouselGestureResult {
  const handleDragMove = useCallback(
    (sample: DragEngineMovePayload) => {
      updateDrag(sample.uiOffset);
    },
    [updateDrag],
  );

  const { isDragging, isInteracting, dragListeners } = useDragEngine({
    enabled,
    measureRef,
    onPressStart: startDrag,
    onDragMove: handleDragMove,
    config: dragConfig,
    onRelease: finishDrag,
  });

  return { isDragging, isInteracting, dragListeners };
}
