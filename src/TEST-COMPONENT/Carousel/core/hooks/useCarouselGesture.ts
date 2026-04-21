import { type RefObject } from "react";
import {
  type DragEndPayload,
  type DragListeners,
  useDrag,
} from "../../../../shared/hooks/useDrag";
import { SAFE_DRAG_SETTINGS } from "../model/normalization";

interface GestureProps {
  onPressStart: () => void;
  onDragMove: (dragOffset: number) => void;
  onDragEnd: (payload: DragEndPayload) => void;
  enabled: boolean;
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
  measureRef,
}: GestureProps): GestureResult {
  const { isDragging, isInteracting, dragListeners } = useDrag({
    enabled,
    measureRef,
    onPressStart,
    onDragMove: (sample) => {
      onDragMove(sample.offset);
    },
    config: SAFE_DRAG_SETTINGS,
    onDragEnd,
  });

  return { isDragging, isInteracting, dragListeners };
}
