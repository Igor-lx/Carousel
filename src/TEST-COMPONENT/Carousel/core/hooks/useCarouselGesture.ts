import { type RefObject } from "react";
import type { CarouselDragSettings } from "../model/diagnostic";
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
  dragSettings: CarouselDragSettings;
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
  dragSettings,
  measureRef,
}: GestureProps): GestureResult {
  const { isDragging, isInteracting, dragListeners } = useDrag({
    enabled,
    measureRef,
    onPressStart,
    onDragMove: (sample) => {
      onDragMove(sample.offset);
    },
    config: dragSettings,
    onDragEnd,
  });

  return { isDragging, isInteracting, dragListeners };
}
