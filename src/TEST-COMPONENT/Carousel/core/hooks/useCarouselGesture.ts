import { type RefObject } from "react";
import type { CarouselDragConfig } from "../model/diagnostic";
import {
  type DragEngineEndPayload,
  type DragEngineListeners,
  useDragEngine,
} from "../../../../shared/drag-engine";

interface GestureProps {
  onPressStart: () => void;
  onDragMove: (dragOffset: number) => void;
  onDragEnd: (payload: DragEngineEndPayload) => void;
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
  onDragEnd,
  enabled,
  dragConfig,
  measureRef,
}: GestureProps): GestureResult {
  const { isDragging, isInteracting, dragListeners } = useDragEngine({
    enabled,
    measureRef,
    onPressStart,
    onDragMove: (sample) => {
      onDragMove(sample.offset);
    },
    config: dragConfig,
    onDragEnd,
  });

  return { isDragging, isInteracting, dragListeners };
}
