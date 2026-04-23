import { type RefObject } from "react";
import type { CarouselDragConfig } from "../model/diagnostic";
import {
  type DragEndPayload,
  type DragListeners,
  useDrag,
} from "../../../../shared/hooks/useDrag";

interface GestureProps {
  onPressStart: () => void;
  onDragMove: (dragOffset: number) => void;
  onDragEnd: (payload: DragEndPayload) => void;
  enabled: boolean;
  dragConfig: CarouselDragConfig;
  measureRef: RefObject<HTMLDivElement | null>;
}

interface GestureResult {
  isDragging: boolean;
  isInteracting: boolean;
  dragListeners: DragListeners;
}

export function useCarouselGesture({
  onPressStart,
  onDragMove,
  onDragEnd,
  enabled,
  dragConfig,
  measureRef,
}: GestureProps): GestureResult {
  const { isDragging, isInteracting, dragListeners } = useDrag({
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
