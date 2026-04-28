import { useCallback, type RefObject } from "react";
import type { CarouselDragConfig } from "../../model/diagnostic";
import {
  type DragEngineListeners,
  type DragEngineMovePayload,
  type DragEngineReleasePayload,
  useDragEngine,
} from "../../../../../shared/touch-input";

interface CarouselGestureController {
  startDrag: () => void;
  updateDrag: (dragOffset: number) => void;
  finishDrag: (payload: DragEngineReleasePayload) => void;
}

interface UseCarouselGestureProps {
  controller: CarouselGestureController;
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
  controller,
  enabled,
  dragConfig,
  measureRef,
}: UseCarouselGestureProps): UseCarouselGestureResult {
  const handleDragMove = useCallback(
    (sample: DragEngineMovePayload) => {
      controller.updateDrag(sample.uiOffset);
    },
    [controller],
  );

  const { isDragging, isInteracting, dragListeners } = useDragEngine({
    enabled,
    measureRef,
    onPressStart: controller.startDrag,
    onDragMove: handleDragMove,
    config: dragConfig,
    onRelease: controller.finishDrag,
  });

  return { isDragging, isInteracting, dragListeners };
}
