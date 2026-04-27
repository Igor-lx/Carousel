import { type RefObject } from "react";
import type { CarouselDragConfig } from "../model/diagnostic";
import {
  type DragEngineListeners,
  type DragEngineReleasePayload,
  useDragEngine,
} from "../../../../shared/touch-input";

interface GestureProps {
  onPressStart: () => void;
  onDragMove: (dragOffset: number) => void;
  onRelease: (payload: DragEngineReleasePayload) => void;
  enabled: boolean;
  dragConfig: CarouselDragConfig;
  measureRef: RefObject<HTMLDivElement | null>;
}

interface GestureResult {
  isDragging: boolean;
  isInteracting: boolean;
  dragListeners: DragEngineListeners;
}

export function useCarouselGesture({
  onPressStart,
  onDragMove,
  onRelease,
  enabled,
  dragConfig,
  measureRef,
}: GestureProps): GestureResult {
  const { isDragging, isInteracting, dragListeners } = useDragEngine({
    enabled,
    measureRef,
    onPressStart,
    onDragMove: (sample) => {
      onDragMove(sample.uiOffset);
    },
    config: dragConfig,
    onRelease,
  });

  return { isDragging, isInteracting, dragListeners };
}
